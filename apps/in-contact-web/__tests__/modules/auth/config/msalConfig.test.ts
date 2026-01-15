import { ConfigurationError } from '@/shared/errors';

// Unmock msalConfig to test the actual implementation
jest.unmock('@/modules/auth/config/msalConfig');

// Mock PublicClientApplication before any imports
jest.mock('@azure/msal-browser', () => {
  const mockInstance = {
    initialize: jest.fn(),
    getAllAccounts: jest.fn(),
    getAccountByUsername: jest.fn(),
    loginPopup: jest.fn(),
    logout: jest.fn(),
    acquireTokenSilent: jest.fn(),
  };
  
  return {
    PublicClientApplication: jest.fn().mockImplementation(() => mockInstance),
  };
});

describe('msalConfig', () => {
  let PublicClientApplication: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    const { PublicClientApplication: PCA } = require('@azure/msal-browser');
    PublicClientApplication = PCA;
    PublicClientApplication.mockClear();
  });

  it('should validate config and create msalInstance', () => {
    const msalConfig = require('@/modules/auth/config/msalConfig');
    expect(msalConfig.msalInstance).toBeDefined();
  });

  it('should have msalInstance created', () => {
    const msalConfig = require('@/modules/auth/config/msalConfig');
    expect(PublicClientApplication).toHaveBeenCalled();
    expect(msalConfig.msalInstance).toBeDefined();
  });

  it('should configure cache location as localStorage', () => {
    require('@/modules/auth/config/msalConfig');
    
    // Check that PublicClientApplication was called with correct config
    const callArgs = PublicClientApplication.mock.calls[0]?.[0];
    expect(callArgs?.cache?.cacheLocation).toBe('localStorage');
  });

  it('should configure authority with tenant ID', () => {
    require('@/modules/auth/config/msalConfig');
    
    // Check that PublicClientApplication was called with correct auth config
    const callArgs = PublicClientApplication.mock.calls[0]?.[0];
    expect(callArgs?.auth?.authority).toContain('login.microsoftonline.com');
    expect(callArgs?.auth?.clientId).toBeDefined();
    expect(callArgs?.auth?.redirectUri).toBeDefined();
  });
});

