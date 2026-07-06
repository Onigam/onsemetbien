import { describe, it, expect } from 'vitest';
import { formatDuration, formatDate, formatDateTime } from './format';

describe('formatDuration', () => {
  it('formats a whole number of minutes and seconds as m:ss', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
    expect(formatDuration(125)).toBe('2:05');
  });

  it('zero-pads the seconds to two digits', () => {
    expect(formatDuration(61)).toBe('1:01');
    expect(formatDuration(9)).toBe('0:09');
  });

  it('floors fractional seconds', () => {
    expect(formatDuration(65.9)).toBe('1:05');
    expect(formatDuration(59.4)).toBe('0:59');
  });

  it('returns Unknown for undefined', () => {
    expect(formatDuration(undefined)).toBe('Unknown');
  });

  it('returns Unknown for zero', () => {
    expect(formatDuration(0)).toBe('Unknown');
  });

  it('returns Unknown for negative durations', () => {
    expect(formatDuration(-5)).toBe('Unknown');
  });
});

describe('formatDate', () => {
  const iso = '2026-07-06T15:14:00.000Z';

  it('does not throw and returns a non-empty string for a valid ISO date', () => {
    const result = formatDate(iso);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('matches the native toLocaleDateString output', () => {
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleDateString());
  });
});

describe('formatDateTime', () => {
  const iso = '2026-07-06T15:14:00.000Z';

  it('does not throw and returns a non-empty string for a valid ISO date', () => {
    const result = formatDateTime(iso);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('matches the native toLocaleString output', () => {
    expect(formatDateTime(iso)).toBe(new Date(iso).toLocaleString());
  });
});
