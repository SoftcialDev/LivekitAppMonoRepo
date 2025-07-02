import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@assets/ColletteHealth_logo.png';
import camaraLogo from '@assets/InContact_logo.png';
import { SignInButton } from '../components/SignInButton';
import IconWithLabel from '../../../components/IconWithLabel';

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
    // Redirect user after login based on role claims
    if (!initialized || !account) return;

    const claims = account.idTokenClaims as Record<string, any>;
    const rolesClaim = claims.roles ?? claims.role;
    const roles: string[] = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];
    console.debug('LoginPage: detected roles on init:', roles);

    if (roles.includes('Employee')) {
      navigate('/psosDashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, account, navigate]);

  /**
   * handleLogin
   * Triggers MSAL popup login, validates roles, and redirects accordingly.
   * If no roles are assigned, logs out and shows an error.
   */
  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Open MSAL popup for authentication
      const result = await login();
      const claims = result.idTokenClaims as Record<string, any>;
      const rolesClaim = claims.roles ?? claims.role;
      const roles: string[] = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];
      console.debug('LoginPage: roles from popup result:', roles);

      // If user has no role, treat as unregistered
      if (roles.length === 0 || roles[0] == null) {
        console.warn('LoginPage: user has no roles assigned');
        await logout();
        setErrorMessage(
          'Your account is not registered. Please contact your administrator to assign you a role.'
        );
        return;
      }

      // Redirect based on role
      if (roles.includes('Employee')) {
        navigate('/psosDashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
