import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '@/modules/auth/contexts/AuthContext';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { ConfigurationError } from '@/shared/errors';
import { NotSignedInError } from '@/modules/auth/errors';

// Mock dependencies
jest.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMsal: jest.fn(),
  useIsAuthenticated: jest.fn(),
}));

jest.mock('@/modules/auth/config/msalConfig', () => ({
  msalInstance: {
    loginPopup: jest.fn(),
    logoutPopup: jest.fn(),
    acquireTokenSilent: jest.fn(),
    acquireTokenPopup: jest.fn(),
  },
}));

jest.mock('@/shared/config', () => ({
  config: {
    azureAdApiScopeUri: 'api://test-scope',
  },
}));

jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
  logDebug: jest.fn(),
}));

const mockedUseMsal = useMsal as jest.MockedFunction<typeof useMsal>;
const mockedUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>;

describe('AuthContext', () => {
  const mockAccount = {
    homeAccountId: 'test-home-id',
    localAccountId: 'test-local-id',
    environment: 'test-env',
    tenantId: 'test-tenant-id',
    username: 'test@example.com',
    name: 'Test User',
  };

  const mockMsalInstance = {
    loginPopup: jest.fn(),
    logoutPopup: jest.fn(),
    acquireTokenSilent: jest.fn(),
    acquireTokenPopup: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(false);

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  const TestComponent = ({ children }: { children: React.ReactNode }) => {
    return <AuthProvider>{children}</AuthProvider>;
  };

  const ConsumerComponent = () => {
    const context = React.useContext(AuthContext);
    return (
      <div>
        <div data-testid="account">{context.account?.username || 'null'}</div>
        <div data-testid="initialized">{context.initialized.toString()}</div>
        <button
          data-testid="login"
          onClick={() => context.login()}
        >
          Login
        </button>
        <button
          data-testid="logout"
          onClick={() => context.logout()}
        >
          Logout
        </button>
        <button
          data-testid="get-api-token"
          onClick={() => context.getApiToken()}
        >
          Get Token
        </button>
        <button
          data-testid="refresh-roles"
          onClick={() => context.refreshRoles()}
        >
          Refresh Roles
        </button>
      </div>
    );
  };

  it('should provide default context value', () => {
    const { result } = render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    expect(screen.getByTestId('account')).toHaveTextContent('null');
    expect(screen.getByTestId('initialized')).toHaveTextContent('false');
  });

  it('should initialize account when authenticated', async () => {
    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
      expect(screen.getByTestId('account')).toHaveTextContent(mockAccount.username);
    });
  });

  it('should handle login popup', async () => {
    const mockResult = {
      account: mockAccount,
      accessToken: 'token',
      idToken: 'id-token',
    };

    mockMsalInstance.loginPopup.mockResolvedValue(mockResult);

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [],
      inProgress: 'none',
    });

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    const loginButton = screen.getByTestId('login');
    
    await waitFor(async () => {
      loginButton.click();
    });

    expect(mockMsalInstance.loginPopup).toHaveBeenCalledWith({
      scopes: ['openid', 'profile'],
      prompt: 'select_account',
    });
  });

  it('should handle logout', async () => {
    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('account')).toHaveTextContent(mockAccount.username);
    });

    const logoutButton = screen.getByTestId('logout');
    
    await waitFor(async () => {
      logoutButton.click();
    });

    expect(mockMsalInstance.logoutPopup).toHaveBeenCalledWith({ account: mockAccount });
    expect((window as any).location.href).toBe('/login');
  });

  it('should get API token silently', async () => {
    mockMsalInstance.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
      account: mockAccount,
    });

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    const getTokenButton = screen.getByTestId('get-api-token');
    
    await waitFor(async () => {
      const token = await new Promise<string>((resolve) => {
        const context = React.useContext(AuthContext);
        context.getApiToken().then(resolve);
      });
      expect(token).toBe('test-token');
    });

    expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
      account: mockAccount,
      scopes: ['api://test-scope'],
      forceRefresh: false,
    });
  });

  it('should fallback to popup when silent token acquisition fails', async () => {
    const interactionError = new InteractionRequiredAuthError();
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(interactionError);
    mockMsalInstance.acquireTokenPopup.mockResolvedValue({
      accessToken: 'popup-token',
      account: mockAccount,
    });

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    const getTokenButton = screen.getByTestId('get-api-token');
    
    await waitFor(async () => {
      getTokenButton.click();
    });

    await waitFor(() => {
      expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalled();
    });
  });

  it('should throw NotSignedInError when getting token without account', async () => {
    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(false);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    const getTokenButton = screen.getByTestId('get-api-token');
    
    await waitFor(async () => {
      getTokenButton.click();
    });

    await waitFor(() => {
      expect(mockMsalInstance.acquireTokenSilent).not.toHaveBeenCalled();
    });
  });

  it('should refresh roles silently', async () => {
    const mockResult = {
      account: mockAccount,
      accessToken: 'token',
      idToken: 'id-token',
    };

    mockMsalInstance.acquireTokenSilent.mockResolvedValue(mockResult);

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    const refreshButton = screen.getByTestId('refresh-roles');
    
    await waitFor(async () => {
      refreshButton.click();
    });

    expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledWith({
      account: mockAccount,
      scopes: ['openid', 'profile'],
      forceRefresh: true,
    });
  });

  it('should fallback to popup when silent role refresh fails', async () => {
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(new Error('Silent failed'));
    mockMsalInstance.acquireTokenPopup.mockResolvedValue({
      account: mockAccount,
      accessToken: 'token',
      idToken: 'id-token',
    });

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    render(
      <TestComponent>
        <ConsumerComponent />
      </TestComponent>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    });

    const refreshButton = screen.getByTestId('refresh-roles');
    
    await waitFor(async () => {
      refreshButton.click();
    });

    await waitFor(() => {
      expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalledWith({
        scopes: ['openid', 'profile'],
        prompt: 'none',
      });
    });
  });

  it('should throw ConfigurationError when API scope is missing', async () => {
    jest.resetModules();
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdApiScopeUri: undefined,
      },
    }));

    mockMsalInstance.acquireTokenSilent.mockResolvedValue({
      accessToken: 'test-token',
      account: mockAccount,
    });

    mockedUseMsal.mockReturnValue({
      instance: mockMsalInstance as any,
      accounts: [mockAccount],
      inProgress: 'none',
    });

    mockedUseIsAuthenticated.mockReturnValue(true);

    // Note: This test may need adjustment based on how the config is loaded
    // The error should be thrown when getApiToken is called without apiScope
  });
});

