// Define valid track types
export const VALID_TRACK_TYPES = [
  'music',
  'excerpt',
  'sketch',
  'jingle',
] as const;

export const MAX_DURATION = {
  music: 360, // 6 minutes
  excerpt: 90, // 90 seconds
  sketch: 90, // 90 seconds
  jingle: 20, // 20 seconds
};
