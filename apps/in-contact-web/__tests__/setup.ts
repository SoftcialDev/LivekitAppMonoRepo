import '@testing-library/jest-dom';

global.Request = class Request {
  constructor(public url: string, public init?: RequestInit) {}
} as any;

global.Response = class Response {
  constructor(public body?: BodyInit | null, public init?: ResponseInit) {}
} as any;

Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:7071/api',
    },
  },
  writable: true,
});

jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('@/shared/api/apiClient', () => ({
  setTokenGetter: jest.fn(),
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
  },
}));

jest.mock('@/modules/auth/config/msalConfig', () => ({
  msalInstance: {
    initialize: jest.fn(),
    getAllAccounts: jest.fn(() => []),
    getAccountByUsername: jest.fn(),
    loginPopup: jest.fn(),
    logout: jest.fn(),
    acquireTokenSilent: jest.fn(),
  },
}));

jest.mock('@/modules/auth/pages/LoginPage', () => ({
  LoginPage: () => <div>Login Page</div>,
}));

jest.mock('@/modules/auth/pages/LoadingPage', () => ({
  LoadingPage: () => <div>Loading Page</div>,
}));

