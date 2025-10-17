/**
 * @fileoverview Test Helpers - Shared utilities for API function tests
 * @summary Common test utilities and helper functions
 * @description Reusable test utilities for mocking, assertions, and test data generation
 */

import { Context, HttpRequest } from '@azure/functions';

/**
 * Test utilities for API function testing
 * @description Provides common utilities for creating mocks and test data
 */
export class TestHelpers {
  /**
   * Creates a mock Azure Functions context with default values
   * @param overrides - Optional overrides for the context
   * @returns Mock context object
   */
  static createMockContext(overrides: Partial<Context> = {}): Context {
    return {
      log: {
        verbose: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      bindings: {},
      req: {},
      res: {},
      invocationId: 'test-invocation-id',
      functionName: 'test-function',
      ...overrides
    } as Context;
  }

  /**
   * Creates a mock HTTP request with default values
   * @param overrides - Optional overrides for the request
   * @returns Mock HTTP request object
   */
  static createMockHttpRequest(overrides: Partial<HttpRequest> = {}): HttpRequest {
    return {
      headers: {},
      query: {},
      body: {},
      method: 'GET',
      url: 'http://localhost:7071/api/test',
      ...overrides
    } as HttpRequest;
  }

  /**
   * Creates a mock user object for testing
   * @param overrides - Optional overrides for the user
   * @returns Mock user object
   */
  static createMockUser(overrides: any = {}) {
    return {
      id: this.generateUuid(),
      azureAdObjectId: this.generateUuid(),
      email: this.generateEmail(),
      role: 'Employee',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generates a test UUID
   * @returns A test UUID string
   */
  static generateUuid(): string {
    return 'test-uuid-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generates a test email address
   * @returns A test email string
   */
  static generateEmail(): string {
    return `test-${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  /**
   * Creates a mock JWT payload for authentication testing
   * @param overrides - Optional overrides for the JWT payload
   * @returns Mock JWT payload
   */
  static createMockJwtPayload(overrides: any = {}) {
    return {
      oid: this.generateUuid(),
      upn: this.generateEmail(),
      roles: ['Employee'],
      iss: 'https://login.microsoftonline.com/test-tenant/v2.0',
      aud: 'test-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      ...overrides
    };
  }

  /**
   * Creates a mock WebPubSub token response
   * @param overrides - Optional overrides for the response
   * @returns Mock WebPubSub token response
   */
  static createMockWebPubSubResponse(overrides: any = {}) {
    return {
      token: 'mock-jwt-token',
      endpoint: 'https://test-endpoint.webpubsub.azure.com',
      hubName: 'test-hub',
      groups: ['presence', 'test@example.com', 'cm-status-updates'],
      ...overrides
    };
  }

  /**
   * Creates a mock service container for dependency injection testing
   * @param services - Map of service names to mock implementations
   * @returns Mock service container
   */
  static createMockServiceContainer(services: Record<string, any> = {}) {
    return {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn(),
      resolve: jest.fn().mockImplementation((serviceName: string) => {
        return services[serviceName] || {};
      })
    };
  }

  /**
   * Creates a mock repository with common CRUD operations
   * @param data - Mock data to return from repository methods
   * @returns Mock repository object
   */
  static createMockRepository(data: any = null) {
    return {
      findByAzureAdObjectId: jest.fn().mockResolvedValue(data),
      findById: jest.fn().mockResolvedValue(data),
      create: jest.fn().mockResolvedValue(data),
      update: jest.fn().mockResolvedValue(data),
      delete: jest.fn().mockResolvedValue(data),
      findMany: jest.fn().mockResolvedValue(data ? [data] : [])
    };
  }

  /**
   * Creates a mock domain service
   * @param methods - Map of method names to mock implementations
   * @returns Mock domain service
   */
  static createMockDomainService(methods: Record<string, any> = {}) {
    return {
      generateTokenForUser: jest.fn().mockResolvedValue(this.createMockWebPubSubResponse()),
      ...methods
    };
  }

  /**
   * Creates a mock application service
   * @param methods - Map of method names to mock implementations
   * @returns Mock application service
   */
  static createMockApplicationService(methods: Record<string, any> = {}) {
    return {
      generateToken: jest.fn().mockResolvedValue(this.createMockWebPubSubResponse()),
      ...methods
    };
  }

  /**
   * Asserts that a function throws a specific error type
   * @param fn - Function to test
   * @param errorType - Expected error type
   * @param errorMessage - Expected error message (optional)
   */
  static async expectToThrow(fn: () => Promise<any>, errorType: any, errorMessage?: string) {
    await expect(fn).rejects.toThrow(errorType);
    if (errorMessage) {
      await expect(fn).rejects.toThrow(errorMessage);
    }
  }

  /**
   * Waits for a specified amount of time (useful for async testing)
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after the specified time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
