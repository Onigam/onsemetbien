import axios from 'axios';
import type { Track, Pagination } from '../types';
import type { TrackType } from '../constants/trackTypes';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TypeCount {
  total: number;
  visible: number;
  hidden: number;
}

export interface TrackStats {
  byType: Record<TrackType, TypeCount>;
  totals: TypeCount;
}

interface GetTracksResponse {
  tracks: Track[];
  pagination: Pagination;
}

interface GetTracksParams {
  page: number;
  limit: number;
  search?: string;
  type?: string;
}

interface TrackMetadata {
  duration: number;
  bitrate: number;
  format: string;
  codec: string;
  sampleRate: number;
  channels: number;
}

export const api = {
  async getTracks(params: GetTracksParams): Promise<GetTracksResponse> {
    const response = await apiClient.get('/tracks', { params });
    return response.data;
  },

  async getStats(): Promise<TrackStats> {
    const response = await apiClient.get('/tracks/stats');
    return response.data;
  },

  async getTrack(id: string): Promise<Track> {
    const response = await apiClient.get(`/tracks/${id}`);
    return response.data;
  },

  async updateTrackVisibility(id: string, hidden: boolean): Promise<Track> {
    const response = await apiClient.put(`/tracks/${id}/visibility`, {
      hidden,
    });
    return response.data;
  },

  async adjustTrackVolume(id: string, volume: number): Promise<void> {
    await apiClient.put(`/tracks/${id}/volume`, { volume });
  },

  async getTrackMetadata(id: string): Promise<TrackMetadata> {
    const response = await apiClient.get(`/tracks/${id}/metadata`);
    return response.data;
  },

  async renameTrack(id: string, title: string): Promise<Track> {
    const response = await apiClient.put(`/tracks/${id}/title`, { title });
    return response.data;
  },

  async trimTrack(id: string, startTime: number, duration: number): Promise<Track> {
    const response = await apiClient.post(`/tracks/${id}/trim`, {
      startTime: Number(startTime),
      duration: Number(duration),
    });
    return response.data.track;
  },

  async previewTrimmedAudio(
    id: string,
    startTime: number,
    duration: number
  ): Promise<string> {
    const response = await apiClient.post(`/tracks/${id}/preview-audio`, {
      startTime: Number(startTime),
      duration: Number(duration),
    });
    return response.data.previewUrl;
  },
};
