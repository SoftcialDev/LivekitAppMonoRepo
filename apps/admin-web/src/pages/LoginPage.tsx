import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@/shared/assets/ColletteHealth_logo.png';
import camaraLogo from '@/shared/assets/InContact_logo.png';
import { useAuth } from '@/shared/auth/useAuth';
import IconWithLabel from '@/shared/ui/IconWithLabel';
import { SignInButton } from '@/shared/ui/SignInButton';


/**
 * LoginPage component.
 * Renders a login screen and handles MSAL popup authentication.
 *
 * @component
 * @returns {JSX.Element} The login UI or a loading indicator.
 */
export const LoginPage: React.FC = (): JSX.Element => {
  const { account, initialized, login, logout } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to loading page after successful login
    if (!initialized || !account) return;

    console.debug('LoginPage: user authenticated, redirecting to loading page');
    navigate('/loading', { replace: true });
  }, [initialized, account, navigate]);

  /**
   * handleLogin
   * Triggers MSAL popup login and redirects to loading page.
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
      
    } catch (err: any) {
      console.error('LoginPage: login failed:', err);
      setErrorMessage(
        'Login failed. Please check your popup settings and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialized) {
    return <div>Loading…</div>;
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
