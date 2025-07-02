import { useState, useEffect, useCallback } from 'react';
import { getMyPsos } from '../../../services/userClient';

/**
 * Hook to fetch the list of PSOs the current user is authorized to view.
 *
 * - On mount, calls `getMyPsos()`.
 * - Provides loading and error states.
 * - Exposes a `refetch` function to reload the list.
 *
 * @returns An object containing:
 *  - `psos`: Array of lower-cased PSO emails
 *  - `loading`: True while the request is in flight
 *  - `error`: Error message, or null if none
 *  - `refetch`: Function to re-trigger the fetch
 *
 * @example
 * ```ts
 * const { psos, loading, error, refetch } = useMyPsos();
 * ```
 */
export function useMyPsos(): {
  psos: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [psos, setPsos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPsos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getMyPsos();
      setPsos(list);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load PSOs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPsos();
  }, [fetchPsos]);

  return { psos, loading, error, refetch: fetchPsos };
}
