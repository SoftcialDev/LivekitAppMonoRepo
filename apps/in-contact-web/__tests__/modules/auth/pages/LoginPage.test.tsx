import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AuthenticationError } from '@/modules/auth/errors';

// Mock dependencies
jest.mock('@/modules/auth/hooks/useAuth');
jest.mock('@/ui-kit/buttons', () => ({
  SignInButton: ({ onClick, isLoading }: { onClick: () => void; isLoading?: boolean }) => (
    <button onClick={onClick} disabled={isLoading} data-testid="sign-in-button">
      {isLoading ? 'Signing In…' : 'Sign In'}
    </button>
  ),
}));
jest.mock('@/ui-kit/feedback', () => ({
  Loading: ({ action }: { action: string }) => <div data-testid="loading">Loading: {action}</div>,
}));
jest.mock('@/ui-kit/layout', () => ({
  IconWithLabel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="icon-with-label">{children}</div>
  ),
}));
jest.mock('@/shared/assets/ColletteHealth_logo.png', () => 'logo.png', { virtual: true });
jest.mock('@/shared/assets/InContact_logo.png', () => 'incontact.png', { virtual: true });
jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render loading indicator when not initialized', () => {
    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: false,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText(/initializing authentication/i)).toBeInTheDocument();
  });

  it('should render login page when initialized without account', () => {
    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
    expect(screen.getByTestId('icon-with-label')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('should redirect to loading page when account is authenticated', async () => {
    const mockAccount = {
      homeAccountId: 'test-id',
      localAccountId: 'test-local-id',
      environment: 'test-env',
      tenantId: 'test-tenant',
      username: 'test@example.com',
    };

    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/loading', { replace: true });
    });
  });

  it('should call login when sign in button is clicked', async () => {
    mockLogin.mockResolvedValue({ account: {} });

    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    const signInButton = screen.getByTestId('sign-in-button');
    
    await waitFor(async () => {
      signInButton.click();
    });

    expect(mockLogin).toHaveBeenCalled();
  });

  it('should redirect to loading page after successful login', async () => {
    const mockAccount = { homeAccountId: 'test-id' };
    mockLogin.mockResolvedValue({ account: mockAccount });

    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    const signInButton = screen.getByTestId('sign-in-button');
    
    await waitFor(async () => {
      signInButton.click();
      await mockLogin();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/loading', { replace: true });
    });
  });

  it('should display error message on AuthenticationError', async () => {
    const authError = new AuthenticationError('Authentication failed');
    mockLogin.mockRejectedValue(authError);

    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    const signInButton = screen.getByTestId('sign-in-button');
    
    await waitFor(async () => {
      signInButton.click();
      await mockLogin().catch(() => {});
    });

    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  it('should display generic error message on non-AuthenticationError', async () => {
    mockLogin.mockRejectedValue(new Error('Network error'));

    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    const signInButton = screen.getByTestId('sign-in-button');
    
    await waitFor(async () => {
      signInButton.click();
      await mockLogin().catch(() => {});
    });

    await waitFor(() => {
      expect(screen.getByText(/Login failed. Please check your popup settings/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while login is in progress', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    mockedUseAuth.mockReturnValue({
      account: null,
      initialized: true,
      isLoggedIn: false,
      login: mockLogin,
      logout: jest.fn(),
      getApiToken: jest.fn(),
      refreshRoles: jest.fn(),
    });

    renderWithRouter(<LoginPage />);

    const signInButton = screen.getByTestId('sign-in-button');
    
    await waitFor(async () => {
      signInButton.click();
    });

    expect(screen.getByText('Signing In…')).toBeInTheDocument();
    expect(signInButton).toBeDisabled();
  });
});

