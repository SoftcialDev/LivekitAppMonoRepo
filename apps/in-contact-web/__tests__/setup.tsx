import React from 'react';
import '@testing-library/jest-dom';

global.Request = class Request {
  constructor(public url: string, public init?: RequestInit) {}
} as any;

global.Response = class Response {
  constructor(public body?: BodyInit | null, public init?: ResponseInit) {}
} as any;

Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:7071/api',
        PROD: false,
      },
    },
  },
  writable: true,
  configurable: true,
});

jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('@/shared/api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
  setTokenGetter: jest.fn(),
  isTokenAvailable: jest.fn(),
}));

jest.mock('@/shared/services/webSocket/index', () => ({
  webSocketService: {
    registerHandler: jest.fn(),
  },
}));

jest.mock('@/shared/config', () => ({
  config: {
    apiUrl: 'http://localhost:7071/api',
    azureAdClientId: 'test-client-id',
    azureAdTenantId: 'test-tenant-id',
    azureAdRedirectUri: 'http://localhost:3000',
    azureAdApiScopeUri: 'api://test-scope',
  },
}));

jest.mock('@/modules/auth/config/msalConfig', () => ({
  msalInstance: {
    initialize: jest.fn(),
    getAllAccounts: jest.fn(() => []),
    getAccountByUsername: jest.fn(),
    loginPopup: jest.fn(),
    logout: jest.fn(),
    logoutPopup: jest.fn(),
    acquireTokenSilent: jest.fn(),
    acquireTokenPopup: jest.fn(),
    getLogger: jest.fn(() => ({
      verbose: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

jest.mock('@/shared/assets/ColletteHealth_logo.png', () => 'test-file-stub', { virtual: true });
jest.mock('@/shared/assets/InContact_logo.png', () => 'test-file-stub', { virtual: true });

