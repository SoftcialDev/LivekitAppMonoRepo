import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook to get the current user's role
 * @returns { role: string | null, loading: boolean, error: string | null }
 */
export function useUserRole() {
  const { account, initialized } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized || !account) {
      setRole(null);
      setLoading(false);
      return;
    }

    // For now, we'll determine role based on email patterns or other logic
    // This is a temporary solution - ideally we'd get this from the backend
    const determineRole = () => {
      // You can implement your own logic here to determine the role
      // For example, based on email domain, or by calling an API
      return 'Supervisor'; // Default for now
    };

    try {
      const userRole = determineRole();
      setRole(userRole);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [account, initialized]);

  return { role, loading, error };
}
