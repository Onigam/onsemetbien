import mongoose from 'mongoose';
import { VALID_TRACK_TYPES } from '../common/track-type';
import { Track } from '../types/Track';

const trackSchema = new mongoose.Schema<Track>({
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now },
  type: { type: String, enum: VALID_TRACK_TYPES, required: true },
});

export const TrackModel = mongoose.model<Track>('Track', trackSchema);
