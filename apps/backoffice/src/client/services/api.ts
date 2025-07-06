import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface Track {
  _id: string;
  title: string;
  url: string;
  duration?: number;
  createdAt: string;
  type: string;
  sourceUrl?: string;
  hidden?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
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
};
