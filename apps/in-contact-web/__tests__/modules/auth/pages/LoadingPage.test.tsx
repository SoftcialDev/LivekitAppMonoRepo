import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoadingPage } from '@/modules/auth/pages/LoadingPage';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useRetryUserInfo } from '@/modules/auth/hooks/useRetryUserInfo';
import { useUserInfo } from '@/modules/auth/stores';
import { UserRole } from '@/modules/auth/enums';

// Mock dependencies - must unmock pages that are globally mocked
jest.unmock('@/modules/auth/pages/LoadingPage');
jest.mock('@/modules/auth/hooks/useAuth');
jest.mock('@/modules/auth/hooks/useRetryUserInfo');
jest.mock('@/modules/auth/stores', () => ({
  useUserInfo: jest.fn(),
}));
jest.mock('@/modules/auth/contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthContext: React.createContext(null),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
jest.mock('@/ui-kit/feedback', () => ({
  Loading: ({ action }: { action: string }) => <div data-testid="loading">Loading: {action}</div>,
}));
jest.mock('@/ui-kit/modals', () => ({
  ConfirmModal: ({ open, title, message, onConfirm }: { open: boolean; title: string; message: string; onConfirm: () => void }) =>
    open ? (
      <div data-testid="confirm-modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-message">{message}</div>
        <button onClick={onConfirm} data-testid="modal-confirm">Confirm</button>
      </div>
    ) : null,
}));
jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseRetryUserInfo = useRetryUserInfo as jest.MockedFunction<typeof useRetryUserInfo>;
const mockedUseUserInfo = useUserInfo as jest.MockedFunction<typeof useUserInfo>;
const mockNavigate = jest.fn();
const mockRetryLoadUserInfo = jest.fn().mockResolvedValue(undefined);
const mockReset = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LoadingPage', () => {
  const mockAccount = {
    homeAccountId: 'test-home-id',
    localAccountId: 'test-local-id',
    environment: 'test-env',
    tenantId: 'test-tenant-id',
    username: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockRetryLoadUserInfo.mockClear();
    mockReset.mockClear();

    mockedUseRetryUserInfo.mockReturnValue({
      isRetrying: false,
      hasFailed: false,
      currentAttempt: 0,
      error: null,
      retryLoadUserInfo: mockRetryLoadUserInfo,
      reset: mockReset,
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: null,
      isLoading: false,
    });
  });

  it('should redirect to login when no account is available', async () => {
    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should trigger user info loading when account is available', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockRetryLoadUserInfo).toHaveBeenCalled();
    });
  });

  it('should not trigger loading if userInfo is already loaded', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PSO,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    // Should not trigger loading if userInfo exists
    expect(mockRetryLoadUserInfo).not.toHaveBeenCalled();
  });

  it('should redirect to /psosDashboard for PSO role', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.PSO,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/psosDashboard', { replace: true });
    });
  });

  it('should redirect to /contactManagerDashboard for ContactManager role', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.ContactManager,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/contactManagerDashboard', { replace: true });
    });
  });

  it('should redirect to /psos-streaming for Admin role', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Admin,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/psos-streaming', { replace: true });
    });
  });

  it('should redirect to /psos-streaming for Supervisor role', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.Supervisor,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/psos-streaming', { replace: true });
    });
  });

  it('should redirect to /psos-streaming for SuperAdmin role', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.SuperAdmin,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/psos-streaming', { replace: true });
    });
  });

  it('should redirect to /login for unknown role', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseUserInfo.mockReturnValue({
      userInfo: {
        azureAdObjectId: 'test-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: null,
        permissions: [],
      },
      isLoading: false,
    });

    renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should show error modal when retry has failed', () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseRetryUserInfo.mockReturnValue({
      isRetrying: false,
      hasFailed: true,
      currentAttempt: 4,
      error: new Error('Failed'),
      retryLoadUserInfo: mockRetryLoadUserInfo,
      reset: mockReset,
    });

    renderWithRouter(<LoadingPage />);

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Unable to Start Session');
  });

  it('should reset and navigate to login when error modal is confirmed', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseRetryUserInfo.mockReturnValue({
      isRetrying: false,
      hasFailed: true,
      currentAttempt: 4,
      error: new Error('Failed'),
      retryLoadUserInfo: mockRetryLoadUserInfo,
      reset: mockReset,
    });

    renderWithRouter(<LoadingPage />);

    const confirmButton = screen.getByTestId('modal-confirm');
    confirmButton.click();

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('should show loading spinner while retrying', () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    mockedUseRetryUserInfo.mockReturnValue({
      isRetrying: true,
      hasFailed: false,
      currentAttempt: 1,
      error: null,
      retryLoadUserInfo: mockRetryLoadUserInfo,
      reset: mockReset,
    });

    renderWithRouter(<LoadingPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('should not trigger loading multiple times for same account', async () => {
    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    const { rerender } = renderWithRouter(<LoadingPage />);

    await waitFor(() => {
      expect(mockRetryLoadUserInfo).toHaveBeenCalledTimes(1);
    });

    // Re-render with same account
    rerender(
      <BrowserRouter>
        <LoadingPage />
      </BrowserRouter>
    );

    // Should not trigger again
    expect(mockRetryLoadUserInfo).toHaveBeenCalledTimes(1);
  });
});

