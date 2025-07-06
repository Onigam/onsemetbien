import { useState, useEffect } from 'react';
import { api } from '../services/api';

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

interface UseTrackListParams {
  page: number;
  limit: number;
  search: string;
  type: string;
}

interface UseTrackListReturn {
  tracks: Track[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTrackList = ({
  page,
  limit,
  search,
  type,
}: UseTrackListParams): UseTrackListReturn => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getTracks({ page, limit, search, type });
      setTracks(response.tracks);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [page, limit, search, type]);

  return {
    tracks,
    pagination,
    loading,
    error,
    refetch: fetchTracks,
  };
};
