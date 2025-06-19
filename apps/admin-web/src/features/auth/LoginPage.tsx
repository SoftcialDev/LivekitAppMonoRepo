import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Simple login page triggering MSAL popup.
 */
export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <button
        onClick={login}
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
      >
        Sign in with Microsoft 365
      </button>
    </div>
  );
};
