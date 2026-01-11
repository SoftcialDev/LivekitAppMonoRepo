/**
 * @fileoverview Auth module barrel export
 * @summary Re-exports all authentication-related components, hooks, and types
 */

// Contexts
export { AuthContext, AuthProvider } from './contexts/AuthContext';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useRetryUserInfo } from './hooks/useRetryUserInfo';

// Stores
export { useUserInfoStore, useUserInfo } from './stores';

// Config
export { msalInstance } from './config/msalConfig';

// Types
export type { UserInfo, UserStatus, IUseRetryUserInfoReturn } from './types';

// Enums
export { UserRole } from './enums';

// Interfaces
export type { IAuthContextValue, IUserInfoContextValue } from './interfaces';

// API
export { getCurrentUser, refreshUserInfo } from './api/userInfoClient';

// Services
export { UserInfoService } from './services/UserInfoService';

// Errors
export { AuthenticationError, NotSignedInError } from './errors';

// Pages
export { LoginPage, LoadingPage } from './pages';

// Routes
export { authRoutes } from './routes';

