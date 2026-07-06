import type { TrackType } from './constants/trackTypes';

/**
 * Track as returned by the back-office JSON API.
 * (`createdAt` is an ISO string over the wire, unlike the Mongoose model.)
 */
export interface Track {
  _id: string;
  title: string;
  url: string;
  duration?: number;
  createdAt: string;
  type: TrackType;
  sourceUrl?: string;
  hidden?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
