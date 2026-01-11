/**
 * @fileoverview LoginPage - Authentication page component
 * @summary Login screen with MSAL authentication
 * @description Renders a login screen and handles MSAL popup authentication.
 * Redirects to loading page after successful login.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@/shared/assets/ColletteHealth_logo.png';
import camaraLogo from '@/shared/assets/InContact_logo.png';
import { useAuth } from '../hooks/useAuth';
import { IconWithLabel } from '@/ui-kit/layout';
import { SignInButton } from '@/ui-kit/buttons';
import { Loading } from '@/ui-kit/feedback';
import { logDebug, logError } from '@/shared/utils/logger';
import { AuthenticationError } from '../errors';

/**
 * LoginPage component
 * 
 * Renders a login screen and handles MSAL popup authentication.
 * Redirects to loading page after successful login where user information
 * will be loaded from the database.
 * 
 * @returns The login UI or a loading indicator
 */
export const LoginPage: React.FC = (): JSX.Element => {
  const { account, initialized, login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to loading page after successful login
    if (!initialized || !account) return;

    logDebug('LoginPage: user authenticated, redirecting to loading page');
    navigate('/loading', { replace: true });
  }, [initialized, account, navigate]);

  /**
   * Handle login: triggers MSAL popup login and redirects to loading page.
   * User information will be loaded from database in LoadingPage.
   */
  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Open MSAL popup for authentication
      await login();

      // Redirect to loading page to fetch user information from database
      navigate('/loading', { replace: true });
    } catch (err: unknown) {
      logError('LoginPage: login failed', { error: err });
      
      if (err instanceof AuthenticationError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          'Login failed. Please check your popup settings and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialized) {
    return (
      <Loading
        action="initializing authentication"
        bgClassName="bg-[var(--color-primary-dark)]"
      />
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--color-primary-dark)] px-4 sm:px-6">
      {/* Logo */}
      <img
        src={logoSrc}
        alt="Collette Health"
        className="h-16 sm:h-20 md:h-24 mb-12"
      />

      {/* Camera icon + label */}
      <IconWithLabel src={camaraLogo} alt="Camera Icon">
        In Contact
      </IconWithLabel>

      {/* Sign In Button */}
      <SignInButton onClick={handleLogin} isLoading={isLoading} />

      {/* Error Message */}
      {errorMessage && (
        <p className="mt-4 montserrat-bold text-tertiary text-center px-4">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

