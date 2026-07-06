import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Stubbed axios instance returned by axios.create(). We spy on the HTTP verbs
// so no real request is ever issued.
const getMock = vi.fn();
const putMock = vi.fn();
const postMock = vi.fn();

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: getMock,
      put: putMock,
      post: postMock,
    })),
  },
}));

// Import after the mock is registered so `axios.create` is already stubbed.
const { api } = await import('./api');

describe('api service', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    postMock.mockReset();
  });

  it('creates the axios client with the /api base URL', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: '/api' })
    );
  });

  it('getTracks hits /tracks with the params and unwraps response.data', async () => {
    const payload = { tracks: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    getMock.mockResolvedValueOnce({ data: payload });

    const params = { page: 2, limit: 10, search: 'foo', type: 'music' };
    const result = await api.getTracks(params);

    expect(getMock).toHaveBeenCalledWith('/tracks', { params });
    expect(result).toBe(payload);
  });

  it('getStats hits /tracks/stats and unwraps response.data', async () => {
    const payload = { byType: {}, totals: { total: 0, visible: 0, hidden: 0 } };
    getMock.mockResolvedValueOnce({ data: payload });

    const result = await api.getStats();

    expect(getMock).toHaveBeenCalledWith('/tracks/stats');
    expect(result).toBe(payload);
  });

  it('getTrack hits /tracks/:id and unwraps response.data', async () => {
    const track = { _id: 'abc' };
    getMock.mockResolvedValueOnce({ data: track });

    const result = await api.getTrack('abc');

    expect(getMock).toHaveBeenCalledWith('/tracks/abc');
    expect(result).toBe(track);
  });

  it('renameTrack PUTs the trimmed-by-caller title to /tracks/:id/title', async () => {
    const track = { _id: 'abc', title: 'New' };
    putMock.mockResolvedValueOnce({ data: track });

    const result = await api.renameTrack('abc', 'New');

    expect(putMock).toHaveBeenCalledWith('/tracks/abc/title', { title: 'New' });
    expect(result).toBe(track);
  });

  it('updateTrackVisibility PUTs the hidden flag to /tracks/:id/visibility', async () => {
    const track = { _id: 'abc', hidden: true };
    putMock.mockResolvedValueOnce({ data: track });

    const result = await api.updateTrackVisibility('abc', true);

    expect(putMock).toHaveBeenCalledWith('/tracks/abc/visibility', { hidden: true });
    expect(result).toBe(track);
  });

  it('adjustTrackVolume PUTs the volume to /tracks/:id/volume', async () => {
    putMock.mockResolvedValueOnce({ data: {} });

    await api.adjustTrackVolume('abc', 1.5);

    expect(putMock).toHaveBeenCalledWith('/tracks/abc/volume', { volume: 1.5 });
  });

  it('trimTrack POSTs numeric start/duration and unwraps response.data.track', async () => {
    const track = { _id: 'abc' };
    postMock.mockResolvedValueOnce({ data: { track } });

    const result = await api.trimTrack('abc', 5, 30);

    expect(postMock).toHaveBeenCalledWith('/tracks/abc/trim', {
      startTime: 5,
      duration: 30,
    });
    expect(result).toBe(track);
  });
});
