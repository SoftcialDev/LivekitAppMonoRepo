import { useState, useEffect, useCallback } from 'react';
import { getMyPsos, PsoWithSupervisor } from '../../../services/userClient';

/**
 * Hook to fetch the list of PSOs the current user is authorized to view,
 * each with their supervisor’s full name.
 *
 * - On mount, calls `getMyPsos()`.
 * - Provides loading and error states.
 * - Exposes a `refetch` function to reload the list.
 *
 * @returns An object containing:
 *  - `psos`: Array of {@link PsoWithSupervisor}
 *  - `loading`: `true` while the request is in flight
 *  - `error`: Error message, or `null` if none
 *  - `refetch`: Function to re-trigger the fetch
 *
 * @example
 * ```ts
 * const { psos, loading, error, refetch } = useMyPsos();
 * if (!loading && !error) {
 *   psos.forEach(p => {
 *     console.log(p.email, '→ Supervisor:', p.supervisorName);
 *   });
 * }
 * ```
 */
export function useMyPsos(): {
  psos: PsoWithSupervisor[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [psos, setPsos] = useState<PsoWithSupervisor[]>([]);
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
