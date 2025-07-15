import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import logoSrc from '@assets/ColletteHealth_logo.png';
import camaraLogo from '@assets/InContact_logo.png';
import { SignInButton } from '../components/SignInButton';
import IconWithLabel from '@components/IconWithLabel';
import type { AuthenticationResult } from '@azure/msal-browser';

/**
 * LoginPage component.
 *
 * @component
 *
 * @remarks
 * - In **development** (`MODE !== 'production'`), uses MSAL popup login for fast iteration.
 * - In **production** (packaged Electron), uses MSAL redirect login to avoid any nested‐popup issues.
 */
export const LoginPage: React.FC = (): JSX.Element => {
  const { account, initialized, loginPopup, loginRedirect, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // After MSAL is ready and we have an account, send them on their way
  useEffect(() => {
    if (!initialized || !account) return;
    const claims     = account.idTokenClaims as Record<string, any>;
    const rolesClaim = claims.roles ?? claims.role;
    const roles: string[] = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];
    const target = roles.includes('Employee') ? '/psosDashboard' : '/dashboard';
    navigate(target, { replace: true });
  }, [initialized, account, navigate]);

  /**
   * handleLogin
   *
   * @remarks
   * - If running in production (Electron), use a full‐window redirect.
   * - Otherwise (dev), use a popup.
   * - Never mix popup→popup inside an existing popup (that trips MSAL’s block_nested_popups).
   */
  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null);
    setIsLoading(true);

    const isProd = import.meta.env.MODE === 'production';

    try {
      if (isProd) {
        // ➜ Electron/Desktop: avoid nested popups entirely
        await loginRedirect();
        // we return here because redirect will unload this window
        return;
      }

      // ➜ Browser/Dev: use popup for faster flow
      const result: AuthenticationResult = await loginPopup();
      const claims     = result.idTokenClaims as Record<string, any>;
      const rolesClaim = claims.roles ?? claims.role;
      const roles: string[] = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];

      if (roles.length === 0 || !roles[0]) {
        await logout();
        setErrorMessage(
          'Your account is not registered. Please contact your administrator.'
        );
        return;
      }

      const target = roles.includes('Employee') ? '/psosDashboard' : '/dashboard';
      navigate(target, { replace: true });
    } catch (err: any) {
      console.error('LoginPage: login failed:', err);
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
      <img
        src={logoSrc}
        alt="Collette Health"
        className="h-16 sm:h-20 md:h-24 mb-12"
      />

      <IconWithLabel src={camaraLogo} alt="Camera Icon">
        In Contact
      </IconWithLabel>

      <SignInButton onClick={handleLogin} isLoading={isLoading} />

      {errorMessage && (
        <p className="mt-4 montserrat-bold text-tertiary text-center px-4">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
