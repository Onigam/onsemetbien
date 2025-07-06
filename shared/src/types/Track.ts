import { VALID_TRACK_TYPES } from '../common/track-type';

export type TrackType = (typeof VALID_TRACK_TYPES)[number];

export interface Track {
  _id?: string;
  title: string;
  url: string;
  duration?: number;
  createdAt: Date;
  type: TrackType;
  sourceUrl?: string;
  hidden?: boolean;
}
