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

jest.mock('../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    cameraStartFailure: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    contactManagerForm: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    apiErrorLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    pendingCommand: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
  getPrismaClient: jest.fn(),
}));

// Mock Prisma enums
const CameraFailureStage = {
  Permission: 'Permission',
  Enumerate: 'Enumerate',
  TrackCreate: 'TrackCreate',
  LiveKitConnect: 'LiveKitConnect',
  Publish: 'Publish',
  Unknown: 'Unknown',
} as const;

const FormType = {
  Disconnections: 'Disconnections',
  Admissions: 'Admissions',
  Assistance: 'Assistance',
} as const;

// Create a JsonNull mock that can be compared
const PrismaJsonNull = Object.create(null);
Object.defineProperty(PrismaJsonNull, 'toString', {
  value: () => 'Prisma.JsonNull',
  enumerable: false,
});

jest.mock('@prisma/client', () => {
  try {
    // Try to get actual Prisma if available
    const actualPrisma = jest.requireActual('@prisma/client');
    return {
      ...actualPrisma,
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
      })),
      CameraFailureStage: actualPrisma.CameraFailureStage || CameraFailureStage,
      FormType: actualPrisma.FormType || FormType,
      Prisma: {
        ...actualPrisma.Prisma,
        JsonNull: actualPrisma.Prisma?.JsonNull || PrismaJsonNull,
        InputJsonValue: actualPrisma.Prisma?.InputJsonValue || ({} as any),
        CameraStartFailureWhereInput: {} as any,
        ApiErrorLogWhereInput: {} as any,
      },
    };
  } catch {
    // Fallback if actual Prisma is not available
    return {
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
      })),
      CameraFailureStage,
      FormType,
      Prisma: {
        JsonNull: PrismaJsonNull,
        InputJsonValue: {} as any,
        CameraStartFailureWhereInput: {} as any,
        ApiErrorLogWhereInput: {} as any,
      },
    };
  }
});

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
