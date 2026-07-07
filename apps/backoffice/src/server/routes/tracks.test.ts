// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// --- Mocks -----------------------------------------------------------------
// Hoisted so the factories below can reference them.
const mocks = vi.hoisted(() => ({
  aggregate: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findById: vi.fn(),
  getSignedUrl: vi.fn(),
}));

// Stub the shared package: only what the router imports. No mongoose, no DB.
vi.mock('@onsemetbien/shared', () => ({
  TrackModel: {
    aggregate: mocks.aggregate,
    findByIdAndUpdate: mocks.findByIdAndUpdate,
    find: vi.fn(),
    findById: mocks.findById,
    countDocuments: vi.fn(),
  },
  VALID_TRACK_TYPES: ['music', 'excerpt', 'sketch', 'jingle'],
  MAX_DURATION: { music: 360, excerpt: 160, sketch: 160, jingle: 20 },
}));

// Stub the presigner so no AWS signing / network happens; capture the command.
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mocks.getSignedUrl,
}));

// The router pulls these services in at import time; stub them so no ffmpeg /
// yt-dlp / S3 side effects run.
vi.mock('../services/volumeService', () => ({
  volumeService: { adjustVolume: vi.fn(), getMetadata: vi.fn() },
}));
vi.mock('../services/trimService', () => ({
  trimService: { trimTrack: vi.fn(), previewCroppedTrack: vi.fn() },
}));
vi.mock('../services/youtubeDownloadService', () => ({
  YoutubeDownloadService: vi.fn(() => ({ downloadTrack: vi.fn() })),
}));

// Import the router after mocks are registered.
const { tracksRouter } = await import('./tracks');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tracks', tracksRouter);
  return app;
}

describe('GET /api/tracks/stats', () => {
  beforeEach(() => {
    mocks.aggregate.mockReset();
    mocks.findByIdAndUpdate.mockReset();
  });

  it('zero-fills every known type and computes totals from the aggregation', async () => {
    mocks.aggregate.mockResolvedValueOnce([
      { _id: 'music', total: 10, hidden: 2, visible: 8 },
      { _id: 'sketch', total: 3, hidden: 1, visible: 2 },
    ]);

    const res = await request(makeApp()).get('/api/tracks/stats');

    expect(res.status).toBe(200);
    // All 4 known types present, missing ones zero-filled.
    expect(Object.keys(res.body.byType).sort()).toEqual([
      'excerpt',
      'jingle',
      'music',
      'sketch',
    ]);
    expect(res.body.byType.music).toEqual({ total: 10, visible: 8, hidden: 2 });
    expect(res.body.byType.sketch).toEqual({ total: 3, visible: 2, hidden: 1 });
    expect(res.body.byType.excerpt).toEqual({ total: 0, visible: 0, hidden: 0 });
    expect(res.body.byType.jingle).toEqual({ total: 0, visible: 0, hidden: 0 });
    expect(res.body.totals).toEqual({ total: 13, visible: 10, hidden: 3 });
  });

  it('ignores legacy/unknown type buckets in byType but still counts them in totals', async () => {
    mocks.aggregate.mockResolvedValueOnce([
      { _id: 'music', total: 5, hidden: 0, visible: 5 },
      { _id: 'podcast', total: 2, hidden: 1, visible: 1 },
    ]);

    const res = await request(makeApp()).get('/api/tracks/stats');

    expect(res.status).toBe(200);
    expect(res.body.byType).not.toHaveProperty('podcast');
    // Totals aggregate every bucket, including the unknown one.
    expect(res.body.totals).toEqual({ total: 7, visible: 6, hidden: 1 });
  });

  it('returns 500 when the aggregation throws', async () => {
    mocks.aggregate.mockRejectedValueOnce(new Error('db down'));

    const res = await request(makeApp()).get('/api/tracks/stats');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to compute track stats' });
  });
});

describe('PUT /api/tracks/:id/title', () => {
  beforeEach(() => {
    mocks.aggregate.mockReset();
    mocks.findByIdAndUpdate.mockReset();
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(makeApp())
      .put('/api/tracks/abc/title')
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only title with 400', async () => {
    const res = await request(makeApp())
      .put('/api/tracks/abc/title')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Title is required' });
    expect(mocks.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('updates the track with a trimmed title and returns it', async () => {
    const updated = { _id: 'abc', title: 'Fresh Title' };
    mocks.findByIdAndUpdate.mockResolvedValueOnce(updated);

    const res = await request(makeApp())
      .put('/api/tracks/abc/title')
      .send({ title: '  Fresh Title  ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(mocks.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc',
      { title: 'Fresh Title' },
      { new: true }
    );
  });

  it('returns 404 when the track does not exist', async () => {
    mocks.findByIdAndUpdate.mockResolvedValueOnce(null);

    const res = await request(makeApp())
      .put('/api/tracks/missing/title')
      .send({ title: 'Whatever' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Track not found' });
  });
});

describe('GET /api/tracks/:id/download', () => {
  beforeEach(() => {
    mocks.findById.mockReset();
    mocks.getSignedUrl.mockReset();
  });

  it('redirects to a presigned URL that forces an attachment with the title filename', async () => {
    mocks.findById.mockResolvedValueOnce({
      _id: 'abc',
      title: 'Café Crème',
      url: 'uuid-1234.mp3',
    });
    let capturedInput: { Key?: string; ResponseContentDisposition?: string } = {};
    mocks.getSignedUrl.mockImplementationOnce(async (_client, command) => {
      capturedInput = command.input;
      return 'https://signed.example/uuid-1234.mp3?sig=x';
    });

    const res = await request(makeApp()).get('/api/tracks/abc/download');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://signed.example/uuid-1234.mp3?sig=x');
    const cd = capturedInput.ResponseContentDisposition ?? '';
    expect(cd).toContain('attachment');
    // ASCII fallback strips accents; UTF-8 filename* preserves the original.
    expect(cd).toContain('filename="Cafe Creme.mp3"');
    expect(cd).toContain("filename*=UTF-8''Caf%C3%A9%20Cr%C3%A8me.mp3");
  });

  it('returns 404 when the track does not exist', async () => {
    mocks.findById.mockResolvedValueOnce(null);

    const res = await request(makeApp()).get('/api/tracks/missing/download');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Track not found' });
  });
});
