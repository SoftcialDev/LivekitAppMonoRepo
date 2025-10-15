/**
 * @fileoverview LoadingPage - Page that loads user information after login
 * @description Shows loading spinner while fetching user information from database
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/auth/useAuth';
import { useUserInfo } from '../shared/hooks/useUserInfo';
import { setTokenGetter } from '../shared/api/apiClient';
import Loading from '../shared/ui/Loading';

/**
 * LoadingPage component
 * Handles the loading of user information after successful Azure AD login
 */
export const LoadingPage: React.FC = (): JSX.Element => {
  const { account, getApiToken } = useAuth();
  const { loadUserInfo, userInfo, isLoading } = useUserInfo();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async (): Promise<void> => {
      try {
        // Configure token getter for API requests
        setTokenGetter(getApiToken);
        
        // Load user information from database
        await loadUserInfo();
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Redirect to login on error
        navigate('/login', { replace: true });
      }
    };

    // Only load if we have an account but no user info yet
    if (account && !userInfo && !isLoading) {
      loadUserData();
    }
  }, [account, userInfo, isLoading, getApiToken, loadUserInfo, navigate]);

  useEffect(() => {
    // Redirect based on user role once user info is loaded
    if (userInfo) {
      console.debug('LoadingPage: detected role from database:', userInfo.role);

      if (userInfo.role === 'Employee') {
        navigate('/psosDashboard', { replace: true });
      } else if (userInfo.role === 'ContactManager') {
        navigate('/contactManagerDashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [userInfo, navigate]);

  // Show loading spinner
  return (
    <Loading 
      action="is loading your  user information" 
      bgClassName="bg-(--color-primary)"
    />
  );
};

