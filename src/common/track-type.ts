// Define valid track types
export const VALID_TRACK_TYPES = [
  'music',
  'excerpt',
  'sketch',
  'jingle',
] as const;

export const MAX_DURATION = {
  music: 300, // 5 minutes
  excerpt: 90, // 90 seconds
  sketch: 90, // 90 seconds
  jingle: 20, // 20 seconds
};
