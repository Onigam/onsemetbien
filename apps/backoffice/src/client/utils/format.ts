/** Format a duration in seconds as `m:ss`. Returns 'Unknown' when absent. */
export const formatDuration = (seconds?: number): string => {
  if (!seconds && seconds !== 0) return 'Unknown';
  if (seconds <= 0) return 'Unknown';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
};

/** Locale short date, e.g. `7/6/2026`. */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString();

/** Locale date + time, e.g. `7/6/2026, 3:14:00 PM`. */
export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString();
