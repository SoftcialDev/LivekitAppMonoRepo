import { render, screen, waitFor } from '@testing-library/react';
import { AppRouter } from '@/app/routing/AppRouter';
import { setTokenGetter } from '@/shared/api/apiClient';
import { logDebug } from '@/shared/utils/logger';

jest.mock('@/modules/auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: jest.fn(),
}));

jest.mock('@/ui-kit/feedback', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/app/providers/WebSocketProvider', () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/app/layouts', () => ({
  DashboardLayout: () => <div>DashboardLayout</div>,
}));

jest.mock('@/modules/auth/routes', () => ({
  authRoutes: () => [
    { path: '/login', element: <div>Login Page</div> },
    { path: '/loading', element: <div>Loading Page</div> },
  ],
}));

jest.mock('@/modules/error-logs/routes', () => ({
  errorLogsRoutes: () => [{ path: '/errorLogs', element: <div>Error Logs</div> }],
}));

jest.mock('@/modules/user-management/routes', () => ({
  userManagementRoutes: () => [],
}));

jest.mock('@/modules/snapshots/routes', () => ({
  snapshotRoutes: () => [],
}));

jest.mock('@/modules/recordings/routes', () => ({
  recordingRoutes: () => [],
}));

jest.mock('@/modules/talk-sessions/routes', () => ({
  talkSessionsRoutes: () => [],
}));

jest.mock('@/modules/camera-failures/routes', () => ({
  cameraFailuresRoutes: () => [],
}));

jest.mock('@/modules/pso-streaming/routes', () => ({
  psoStreamingRoutes: () => [],
}));

jest.mock('@/modules/contact-manager-dashboard/routes', () => ({
  contactManagerDashboardRoutes: () => [],
}));

jest.mock('@/modules/pso-dashboard/routes', () => ({
  psoDashboardRoutes: () => [],
}));

jest.mock('@/shared/api/apiClient');
jest.mock('@/shared/utils/logger');

describe('AppRouter', () => {
  const mockUseAuth = require('@/modules/auth').useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      account: null,
      initialized: false,
      getApiToken: jest.fn(),
    });
  });

  it('should render RouterProvider', async () => {
    const { container } = render(<AppRouter />);
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('should register token getter when auth is initialized and account exists', async () => {
    const mockGetApiToken = jest.fn();
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
      getApiToken: mockGetApiToken,
    });

    render(<AppRouter />);

    await waitFor(() => {
      expect(setTokenGetter).toHaveBeenCalledWith(mockGetApiToken);
      expect(logDebug).toHaveBeenCalledWith('TokenInjector: registered API token getter');
    });
  });

  it('should not register token getter when auth is not initialized', async () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: false,
      getApiToken: jest.fn(),
    });

    render(<AppRouter />);

    await waitFor(() => {
      expect(setTokenGetter).not.toHaveBeenCalled();
      expect(logDebug).toHaveBeenCalledWith('TokenInjector: user not ready, skipping token registration');
    });
  });

  it('should not register token getter when account is null', async () => {
    mockUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      getApiToken: jest.fn(),
    });

    render(<AppRouter />);

    await waitFor(() => {
      expect(setTokenGetter).not.toHaveBeenCalled();
      expect(logDebug).toHaveBeenCalledWith('TokenInjector: user not ready, skipping token registration');
    });
  });
});

