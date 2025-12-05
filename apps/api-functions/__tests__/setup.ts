/**
 * @fileoverview Test Setup - Global test configuration and utilities
 * @summary Jest setup file for API functions testing
 * @description Global test setup, mocks, and utilities for unit testing
 */

// Mock Azure Functions context and request objects
(global as any).mockContext = {
  log: {
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  bindings: {},
  req: {},
  res: {}
};

(global as any).mockHttpRequest = {
  headers: {},
  query: {},
  body: {},
  method: 'GET',
  url: 'http://localhost:7071/api/test'
};

// Mock Azure Functions modules
jest.mock('@azure/functions', () => ({
  Context: jest.fn(),
  HttpRequest: jest.fn()
}));

const devServiceAccountKey = Buffer.from('incontact-svc-account-key-123xyz').toString('base64');

// Mock configuration
jest.mock('../shared/config', () => ({
  config: {
    node_env: 'test',
    azureTenantId: 'test-tenant-id',
    azureClientId: 'test-client-id',
    azureClientSecret: 'test-client-secret',
    webPubSubEndpoint: 'https://test-endpoint.webpubsub.azure.com',
    webPubSubHubName: 'test-hub',
    webPubSubKey: 'test-webpubsub-key',
    serviceAccountUpn: 'service.account@test.local',
    serviceAccountDisplayName: 'Test Notifications',
    serviceAccountLicenseSkuId: undefined,
    serviceAccountPreferredSkuPartNumbers: ['MCOEV', 'M365_BUSINESS_BASIC'],
    serviceAccountEncryptionKey: devServiceAccountKey
  }
}));

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }))
}));

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

// Mock JWKS client
jest.mock('jwks-rsa', () => jest.fn(() => ({
  getSigningKey: jest.fn((kid, callback) => {
    callback(null, {
      getPublicKey: () => 'mock-public-key'
    });
  })
})));

// Mock Azure Web PubSub
jest.mock('@azure/web-pubsub', () => ({
  WebPubSubServiceClient: jest.fn()
}));

// Global test utilities
(global as any).TestUtils = {
  /**
   * Creates a mock Azure Functions context
   * @param overrides - Optional overrides for the context
   * @returns Mock context object
   */
  createMockContext: (overrides = {}) => ({
    log: {
      verbose: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    },
    bindings: {},
    req: {},
    res: {},
    ...overrides
  }),

  /**
   * Creates a mock HTTP request
   * @param overrides - Optional overrides for the request
   * @returns Mock HTTP request object
   */
  createMockHttpRequest: (overrides = {}) => ({
    headers: {},
    query: {},
    body: {},
    method: 'GET',
    url: 'http://localhost:7071/api/test',
    ...overrides
  }),

  /**
   * Generates a test UUID
   * @returns A test UUID string
   */
  generateUuid: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),

  /**
   * Generates a test email
   * @returns A test email string
   */
  generateEmail: () => `test-${Math.random().toString(36).substr(2, 9)}@example.com`,

  /**
   * Creates a mock user object
   * @param overrides - Optional overrides for the user
   * @returns Mock user object
   */
  createMockUser: (overrides = {}) => ({
    id: (global as any).TestUtils.generateUuid(),
    azureAdObjectId: (global as any).TestUtils.generateUuid(),
    email: (global as any).TestUtils.generateEmail(),
    role: 'PSO',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })
};

// Set test timeout
jest.setTimeout(10000);
