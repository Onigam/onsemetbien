// Centralized track-type metadata for the back-office client.
// Single source of truth for labels, badge colors and max durations.

export const TRACK_TYPES = ['music', 'excerpt', 'sketch', 'jingle'] as const;

export type TrackType = (typeof TRACK_TYPES)[number];

export interface TrackTypeMetaEntry {
  label: string;
  /** Neobrutalist badge fill color. */
  color: string;
  /** Maximum allowed duration in seconds. */
  maxDuration: number;
}

export const TrackTypeMeta: Record<TrackType, TrackTypeMetaEntry> = {
  music: { label: 'Music', color: '#00E5FF', maxDuration: 360 },
  excerpt: { label: 'Excerpt', color: '#4ADE80', maxDuration: 160 },
  sketch: { label: 'Sketch', color: '#FFC107', maxDuration: 160 },
  jingle: { label: 'Jingle', color: '#B794F6', maxDuration: 20 },
};

export const MAX_DURATIONS: Record<TrackType, number> = {
  music: 360,
  excerpt: 160,
  sketch: 160,
  jingle: 20,
};

/** Safe lookup helpers that tolerate unknown/legacy type strings. */
export const getTypeMeta = (type: string): TrackTypeMetaEntry =>
  TrackTypeMeta[type as TrackType] ?? {
    label: type,
    color: '#B0B0B0',
    maxDuration: 360,
  };

export const getTypeColor = (type: string): string => getTypeMeta(type).color;

export const getMaxDuration = (type: string): number =>
  getTypeMeta(type).maxDuration;
