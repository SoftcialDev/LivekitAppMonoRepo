import { ConfigurationError } from '@/shared/errors';

// Mock the config before importing msalConfig
jest.mock('@/shared/config', () => ({
  config: {
    azureAdClientId: 'test-client-id',
    azureAdTenantId: 'test-tenant-id',
    azureAdRedirectUri: 'http://localhost:3000',
  },
}));

// Mock PublicClientApplication
jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    getAllAccounts: jest.fn(),
    getAccountByUsername: jest.fn(),
    loginPopup: jest.fn(),
    logout: jest.fn(),
    acquireTokenSilent: jest.fn(),
  })),
}));

describe('msalConfig', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should create msalInstance with valid config', () => {
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdClientId: 'test-client-id',
        azureAdTenantId: 'test-tenant-id',
        azureAdRedirectUri: 'http://localhost:3000',
      },
    }));

    expect(() => {
      require('@/modules/auth/config/msalConfig');
    }).not.toThrow();
  });

  it('should throw ConfigurationError when clientId is missing', () => {
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdClientId: undefined,
        azureAdTenantId: 'test-tenant-id',
        azureAdRedirectUri: 'http://localhost:3000',
      },
    }));

    expect(() => {
      require('@/modules/auth/config/msalConfig');
    }).toThrow(ConfigurationError);
  });

  it('should throw ConfigurationError when tenantId is missing', () => {
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdClientId: 'test-client-id',
        azureAdTenantId: undefined,
        azureAdRedirectUri: 'http://localhost:3000',
      },
    }));

    expect(() => {
      require('@/modules/auth/config/msalConfig');
    }).toThrow(ConfigurationError);
  });

  it('should throw ConfigurationError when redirectUri is missing', () => {
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdClientId: 'test-client-id',
        azureAdTenantId: 'test-tenant-id',
        azureAdRedirectUri: undefined,
      },
    }));

    expect(() => {
      require('@/modules/auth/config/msalConfig');
    }).toThrow(ConfigurationError);
  });

  it('should configure cache location as localStorage', () => {
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdClientId: 'test-client-id',
        azureAdTenantId: 'test-tenant-id',
        azureAdRedirectUri: 'http://localhost:3000',
      },
    }));

    const { PublicClientApplication } = require('@azure/msal-browser');
    require('@/modules/auth/config/msalConfig');

    expect(PublicClientApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        cache: expect.objectContaining({
          cacheLocation: 'localStorage',
        }),
      })
    );
  });

  it('should configure authority with tenant ID', () => {
    jest.doMock('@/shared/config', () => ({
      config: {
        azureAdClientId: 'test-client-id',
        azureAdTenantId: 'test-tenant-id',
        azureAdRedirectUri: 'http://localhost:3000',
      },
    }));

    const { PublicClientApplication } = require('@azure/msal-browser');
    require('@/modules/auth/config/msalConfig');

    expect(PublicClientApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: expect.objectContaining({
          authority: 'https://login.microsoftonline.com/test-tenant-id/v2.0',
          clientId: 'test-client-id',
          redirectUri: 'http://localhost:3000',
        }),
      })
    );
  });
});

