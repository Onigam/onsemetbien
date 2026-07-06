import { describe, it, expect } from 'vitest';
import {
  TRACK_TYPES,
  TrackTypeMeta,
  getTypeMeta,
  getTypeColor,
  getMaxDuration,
} from './trackTypes';

describe('getTypeMeta', () => {
  it('returns the registered metadata for every known type', () => {
    for (const type of TRACK_TYPES) {
      expect(getTypeMeta(type)).toEqual(TrackTypeMeta[type]);
    }
  });

  it('returns a neutral fallback for an unknown type', () => {
    expect(getTypeMeta('podcast')).toEqual({
      label: 'podcast',
      color: '#B0B0B0',
      maxDuration: 360,
    });
  });
});

describe('getTypeColor', () => {
  it('returns the badge color for each known type', () => {
    expect(getTypeColor('music')).toBe('#00E5FF');
    expect(getTypeColor('excerpt')).toBe('#4ADE80');
    expect(getTypeColor('sketch')).toBe('#FFC107');
    expect(getTypeColor('jingle')).toBe('#B794F6');
  });

  it('returns the fallback grey for an unknown type', () => {
    expect(getTypeColor('mystery')).toBe('#B0B0B0');
  });
});

describe('getMaxDuration', () => {
  it('returns the max duration for each known type', () => {
    expect(getMaxDuration('music')).toBe(360);
    expect(getMaxDuration('excerpt')).toBe(160);
    expect(getMaxDuration('sketch')).toBe(160);
    expect(getMaxDuration('jingle')).toBe(20);
  });

  it('returns the fallback max duration for an unknown type', () => {
    expect(getMaxDuration('mystery')).toBe(360);
  });
});
