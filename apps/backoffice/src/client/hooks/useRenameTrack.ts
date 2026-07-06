import { useCallback, useState } from 'react';
import { api } from '../services/api';

interface UseRenameTrackReturn {
  isSaving: boolean;
  error: string | null;
  /**
   * Persist a new title. Returns `true` when the title was saved (or was a
   * no-op because it did not change), `false` when the request failed.
   */
  rename: (id: string, currentTitle: string, nextTitle: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Shared rename logic used by both the collapsed row (inline edit) and the
 * expanded details panel, so the behaviour stays consistent in one place.
 */
export const useRenameTrack = (onSuccess?: () => void): UseRenameTrackReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rename = useCallback(
    async (id: string, currentTitle: string, nextTitle: string): Promise<boolean> => {
      const trimmed = nextTitle.trim();
      if (!trimmed) {
        setError('Title cannot be empty');
        return false;
      }
      if (trimmed === currentTitle) {
        setError(null);
        return true;
      }

      setIsSaving(true);
      setError(null);
      try {
        await api.renameTrack(id, trimmed);
        onSuccess?.();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rename track');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [onSuccess]
  );

  const clearError = useCallback(() => setError(null), []);

  return { isSaving, error, rename, clearError };
};
