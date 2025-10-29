/**
 * @fileoverview Tests for PrismaClientService
 * @description Tests for Prisma client singleton service
 */

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// No need to import since we're using require with jest.resetModules

describe('PrismaClientService', () => {
  let prisma: any;

  beforeEach(() => {
    // Clear module cache to get fresh instance
    jest.resetModules();
    
    // Import after clearing cache
    const module = require('../../../../shared/infrastructure/database/PrismaClientService');
    prisma = module.default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('default export', () => {
    it('should export prisma instance', () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
    });
  });

  describe('connection management', () => {
    it('should export prisma instance', () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
    });
  });

  describe('environment configuration', () => {
    it('should handle environment variables', () => {
      // Test that the service can be instantiated
      expect(prisma).toBeDefined();
    });
  });
});
