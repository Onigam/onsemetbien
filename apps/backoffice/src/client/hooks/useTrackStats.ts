import { useCallback, useEffect, useState } from 'react';
import { api, type TrackStats } from '../services/api';

interface UseTrackStatsReturn {
  stats: TrackStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTrackStats = (): UseTrackStatsReturn => {
  const [stats, setStats] = useState<TrackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
