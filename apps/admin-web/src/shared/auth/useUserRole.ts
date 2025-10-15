import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserInfoService } from '../services/UserInfoService';
import { getCurrentUser } from '../api/userInfoClient';

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

    const loadUserRole = async () => {
      try {
        setLoading(true);
        
        // First, try to get from localStorage
        const cachedUserInfo = UserInfoService.load();
        if (cachedUserInfo?.role) {
          setRole(cachedUserInfo.role);
          setLoading(false);
          return;
        }

        // If not in cache, fetch from API
        const userInfo = await getCurrentUser();
        if (userInfo?.role) {
          // Cache the user info
          UserInfoService.save(userInfo);
          setRole(userInfo.role);
        } else {
          setRole(null);
        }
      } catch (err: any) {
        console.error('Failed to load user role:', err);
        setError(err.message);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [account, initialized]);

  return { role, loading, error };
}
