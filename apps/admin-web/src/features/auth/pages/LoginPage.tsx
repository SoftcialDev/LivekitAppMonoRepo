import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@assets/ColletteHealth_logo.png';
import camaraLogo from '@assets/InContact_logo.png';
import { SignInButton } from '../components/SignInButton';
import IconWithLabel from '../../../components/IconWithLabel';

/**
 * @component LoginPage
 * @description
 * Renders the login screen and handles MSAL authentication flow.
 *
 * - Shows the Collette Health logo.
 * - Displays an "In Contact" label with camera icon.
 * - Presents a SignInButton.
 * - Once authenticated, redirects:
 *   - Employees → `/psos`
 *   - Admins & Supervisors → `/dashboard`
 *
 * Responsive:
 * - Logo and icon scale on sm/md breakpoints.
 * - Text size increases on larger viewports.
 *
 * @returns {JSX.Element} The login UI or a loading indicator.
 */
export const LoginPage: React.FC = () => {
  const { account, initialized, login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect based on role
  useEffect(() => {
    if (!initialized || !account) return;

    const claims = account.idTokenClaims as Record<string, any>;
    const rolesClaim = claims.roles ?? claims.role;
    const roles: string[] = Array.isArray(rolesClaim)
      ? rolesClaim
      : typeof rolesClaim === 'string'
      ? [rolesClaim]
      : [];

    if (roles.includes('Employee')) {
      navigate('/psos', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, account, navigate]);

  /**
   * handleLogin
   *
   * Triggers the MSAL login popup and redirects upon success.
   */
  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login();

      // After login, determine redirect path
      // account will be updated by useAuth hook
      if (account && account.idTokenClaims) {
        const claims = account.idTokenClaims as Record<string, any>;
        const rolesClaim = claims.roles ?? claims.role;
        const roles: string[] = Array.isArray(rolesClaim)
          ? rolesClaim
          : typeof rolesClaim === 'string'
          ? [rolesClaim]
          : [];

        if (roles.includes('Employee')) {
          navigate('/psos', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setErrorMessage('Login failed. Please try again.');
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

      {/* Sign In */}
      <SignInButton onClick={handleLogin} isLoading={isLoading} />

      {/* Error */}
      {errorMessage && (
        <p className="mt-4 montserrat-bold text-tertiary text-center px-4">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
