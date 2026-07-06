import { describe, expect, it } from 'vitest';
import type { TrackType } from '@onsemetbien/shared';
import {
  RadioScheduler,
  ScheduledTrack,
  SchedulerDeps,
} from './scheduler';

// --- test helpers ---------------------------------------------------------

function track(id: string, type: TrackType, duration = 60): ScheduledTrack {
  return { _id: id, title: `title-${id}`, type, duration, url: `${id}.mp3` };
}

function localShuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** In-memory SchedulerDeps backed by a flat list of playable tracks. */
function makeDeps(tracks: ScheduledTrack[]): SchedulerDeps {
  const byId = new Map(tracks.map((t) => [t._id, t] as const));
  const idsByType = new Map<TrackType, string[]>();
  for (const t of tracks) {
    const arr = idsByType.get(t.type) ?? [];
    arr.push(t._id);
    idsByType.set(t.type, arr);
  }

  return {
    async loadDeck(type) {
      return localShuffle((idsByType.get(type) ?? []).slice());
    },
    async countByType(type) {
      return (idsByType.get(type) ?? []).length;
    },
    async loadTrack(id) {
      return byId.get(id) ?? null;
    },
    async isPlayable(id) {
      return byId.has(id);
    },
  };
}

async function drain(scheduler: RadioScheduler, n: number): Promise<ScheduledTrack[]> {
  const out: ScheduledTrack[] = [];
  for (let i = 0; i < n; i++) {
    const t = await scheduler.advance();
    if (t) out.push(t);
  }
  return out;
}

// --- tests ----------------------------------------------------------------

describe('RadioScheduler variety rules', () => {
  it('never repeats a type back-to-back when alternatives exist', async () => {
    const tracks = [
      ...Array.from({ length: 5 }, (_, i) => track(`m${i}`, 'music')),
      ...Array.from({ length: 5 }, (_, i) => track(`e${i}`, 'excerpt')),
      ...Array.from({ length: 5 }, (_, i) => track(`s${i}`, 'sketch')),
    ];
    const scheduler = new RadioScheduler(makeDeps(tracks));

    const played = await drain(scheduler, 30);
    expect(played).toHaveLength(30);
    for (let i = 1; i < played.length; i++) {
      expect(played[i]!.type).not.toBe(played[i - 1]!.type);
    }
  });

  it('prefers music after a non-music track', async () => {
    const tracks = [
      ...Array.from({ length: 5 }, (_, i) => track(`m${i}`, 'music')),
      ...Array.from({ length: 5 }, (_, i) => track(`e${i}`, 'excerpt')),
    ];
    const scheduler = new RadioScheduler(makeDeps(tracks));

    const played = await drain(scheduler, 20);
    for (let i = 1; i < played.length; i++) {
      if (played[i - 1]!.type !== 'music') {
        expect(played[i]!.type).toBe('music');
      }
    }
  });
});

describe('RadioScheduler shuffled-deck guarantee', () => {
  it('plays every track of a type exactly once before repeating', async () => {
    // Only one type exists, so every draw comes from the same deck.
    const N = 4;
    const tracks = Array.from({ length: N }, (_, i) => track(`m${i}`, 'music'));
    const scheduler = new RadioScheduler(makeDeps(tracks));

    const firstCycle = await drain(scheduler, N);
    const ids = firstCycle.map((t) => t._id);
    expect(ids).toHaveLength(N);
    // A full permutation: all distinct before any repeat.
    expect(new Set(ids).size).toBe(N);
    expect(new Set(ids)).toEqual(new Set(['m0', 'm1', 'm2', 'm3']));
  });
});

describe('RadioScheduler lookahead queue', () => {
  it('peekUpcoming(5) returns 5 distinct items and advance() returns the peeked head', async () => {
    const tracks = [
      ...Array.from({ length: 5 }, (_, i) => track(`m${i}`, 'music')),
      ...Array.from({ length: 5 }, (_, i) => track(`e${i}`, 'excerpt')),
      ...Array.from({ length: 5 }, (_, i) => track(`s${i}`, 'sketch')),
    ];
    const scheduler = new RadioScheduler(makeDeps(tracks), { lookahead: 6 });

    // Seed the queue.
    await scheduler.advance();

    const upcoming = scheduler.peekUpcoming(5);
    expect(upcoming).toHaveLength(5);
    expect(new Set(upcoming.map((t) => t._id)).size).toBe(5);

    // Queue stability: peeking then advancing yields the same head.
    const head = upcoming[0]!;
    const played = await scheduler.advance();
    expect(played?._id).toBe(head._id);
  });
});

describe('RadioScheduler resilience', () => {
  it('skips a stale drawn id, refills the deck, and still returns a playable track', async () => {
    const good = [track('m1', 'music'), track('m2', 'music')];
    let staleServed = false;

    const deps: SchedulerDeps = {
      async loadDeck(type) {
        if (type !== 'music') return [];
        // First load hands out a now-deleted id at the head of the deck;
        // subsequent refills no longer contain it.
        if (!staleServed) {
          staleServed = true;
          return ['gone', 'm1', 'm2'];
        }
        return ['m1', 'm2'];
      },
      async countByType(type) {
        return type === 'music' ? 2 : 0;
      },
      async loadTrack(id) {
        return good.find((t) => t._id === id) ?? null;
      },
      async isPlayable(id) {
        return id === 'm1' || id === 'm2';
      },
    };

    const scheduler = new RadioScheduler(deps);
    const played = await scheduler.advance();

    expect(played).not.toBeNull();
    expect(['m1', 'm2']).toContain(played?._id);
  });

  it('resolves to null when there are no tracks at all, without looping forever', async () => {
    const scheduler = new RadioScheduler(makeDeps([]));
    const played = await scheduler.advance();
    expect(played).toBeNull();
    // A second call must also terminate cleanly.
    expect(await scheduler.advance()).toBeNull();
  });
});
