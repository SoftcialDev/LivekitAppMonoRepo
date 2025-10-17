/**
 * @fileoverview Test Helpers Test - Unit tests for test helper utilities
 * @summary Tests for test helper functions and utilities
 * @description Unit tests for the TestHelpers utility class
 */

import { TestHelpers } from './helpers';

describe('TestHelpers', () => {
  describe('createMockContext', () => {
    it('should create a mock context with default values', () => {
      // Act
      const context = TestHelpers.createMockContext();

      // Assert
      expect(context).toHaveProperty('log');
      expect(context.log).toHaveProperty('verbose');
      expect(context.log).toHaveProperty('info');
      expect(context.log).toHaveProperty('warn');
      expect(context.log).toHaveProperty('error');
      expect(context).toHaveProperty('bindings');
      expect(context).toHaveProperty('req');
      expect(context).toHaveProperty('res');
    });

    it('should apply overrides to mock context', () => {
      // Arrange
      const overrides = {
        bindings: { callerId: 'test-caller-id' },
        invocationId: 'test-invocation-id'
      };

      // Act
      const context = TestHelpers.createMockContext(overrides);

      // Assert
      expect(context.bindings).toEqual(overrides.bindings);
      expect(context.invocationId).toBe(overrides.invocationId);
    });
  });

  describe('createMockHttpRequest', () => {
    it('should create a mock HTTP request with default values', () => {
      // Act
      const request = TestHelpers.createMockHttpRequest();

      // Assert
      expect(request).toHaveProperty('headers');
      expect(request).toHaveProperty('query');
      expect(request).toHaveProperty('body');
      expect(request).toHaveProperty('method');
      expect(request).toHaveProperty('url');
      expect(request.method).toBe('GET');
    });

    it('should apply overrides to mock HTTP request', () => {
      // Arrange
      const overrides = {
        method: 'POST' as any,
        headers: { 'Content-Type': 'application/json' },
        body: { test: 'data' }
      };

      // Act
      const request = TestHelpers.createMockHttpRequest(overrides);

      // Assert
      expect(request.method).toBe('POST');
      expect(request.headers).toEqual(overrides.headers);
      expect(request.body).toEqual(overrides.body);
    });
  });

  describe('createMockUser', () => {
    it('should create a mock user with default values', () => {
      // Act
      const user = TestHelpers.createMockUser();

      // Assert
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('azureAdObjectId');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('deletedAt');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user.role).toBe('Employee');
      expect(user.deletedAt).toBeNull();
    });

    it('should apply overrides to mock user', () => {
      // Arrange
      const overrides = {
        role: 'Supervisor',
        email: 'test@example.com'
      };

      // Act
      const user = TestHelpers.createMockUser(overrides);

      // Assert
      expect(user.role).toBe(overrides.role);
      expect(user.email).toBe(overrides.email);
    });
  });

  describe('generateUuid', () => {
    it('should generate a unique UUID', () => {
      // Act
      const uuid1 = TestHelpers.generateUuid();
      const uuid2 = TestHelpers.generateUuid();

      // Assert
      expect(uuid1).toMatch(/^test-uuid-/);
      expect(uuid2).toMatch(/^test-uuid-/);
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateEmail', () => {
    it('should generate a unique email', () => {
      // Act
      const email1 = TestHelpers.generateEmail();
      const email2 = TestHelpers.generateEmail();

      // Assert
      expect(email1).toMatch(/^test-.*@example\.com$/);
      expect(email2).toMatch(/^test-.*@example\.com$/);
      expect(email1).not.toBe(email2);
    });
  });

  describe('createMockJwtPayload', () => {
    it('should create a mock JWT payload with default values', () => {
      // Act
      const payload = TestHelpers.createMockJwtPayload();

      // Assert
      expect(payload).toHaveProperty('oid');
      expect(payload).toHaveProperty('upn');
      expect(payload).toHaveProperty('roles');
      expect(payload).toHaveProperty('iss');
      expect(payload).toHaveProperty('aud');
      expect(payload).toHaveProperty('exp');
      expect(payload).toHaveProperty('iat');
      expect(payload.roles).toEqual(['Employee']);
    });

    it('should apply overrides to mock JWT payload', () => {
      // Arrange
      const overrides = {
        roles: ['Supervisor', 'Admin'],
        oid: 'custom-oid'
      };

      // Act
      const payload = TestHelpers.createMockJwtPayload(overrides);

      // Assert
      expect(payload.roles).toEqual(overrides.roles);
      expect(payload.oid).toBe(overrides.oid);
    });
  });

  describe('createMockWebPubSubResponse', () => {
    it('should create a mock WebPubSub response with default values', () => {
      // Act
      const response = TestHelpers.createMockWebPubSubResponse();

      // Assert
      expect(response).toHaveProperty('token');
      expect(response).toHaveProperty('endpoint');
      expect(response).toHaveProperty('hubName');
      expect(response).toHaveProperty('groups');
      expect(response.token).toBe('mock-jwt-token');
      expect(response.endpoint).toBe('https://test-endpoint.webpubsub.azure.com');
      expect(response.hubName).toBe('test-hub');
      expect(Array.isArray(response.groups)).toBe(true);
    });

    it('should apply overrides to mock WebPubSub response', () => {
      // Arrange
      const overrides = {
        token: 'custom-token',
        groups: ['custom-group']
      };

      // Act
      const response = TestHelpers.createMockWebPubSubResponse(overrides);

      // Assert
      expect(response.token).toBe(overrides.token);
      expect(response.groups).toEqual(overrides.groups);
    });
  });

  describe('createMockServiceContainer', () => {
    it('should create a mock service container with default methods', () => {
      // Act
      const container = TestHelpers.createMockServiceContainer();

      // Assert
      expect(container).toHaveProperty('getInstance');
      expect(container).toHaveProperty('initialize');
      expect(container).toHaveProperty('resolve');
      expect(typeof container.getInstance).toBe('function');
      expect(typeof container.initialize).toBe('function');
      expect(typeof container.resolve).toBe('function');
    });

    it('should resolve services from the provided map', () => {
      // Arrange
      const services = {
        'TestService': { testMethod: jest.fn() },
        'AnotherService': { anotherMethod: jest.fn() }
      };

      // Act
      const container = TestHelpers.createMockServiceContainer(services);

      // Assert
      expect(container.resolve('TestService')).toEqual(services.TestService);
      expect(container.resolve('AnotherService')).toEqual(services.AnotherService);
    });
  });

  describe('createMockRepository', () => {
    it('should create a mock repository with CRUD methods', () => {
      // Act
      const repository = TestHelpers.createMockRepository();

      // Assert
      expect(repository).toHaveProperty('findByAzureAdObjectId');
      expect(repository).toHaveProperty('findById');
      expect(repository).toHaveProperty('create');
      expect(repository).toHaveProperty('update');
      expect(repository).toHaveProperty('delete');
      expect(repository).toHaveProperty('findMany');
      expect(typeof repository.findByAzureAdObjectId).toBe('function');
    });

    it('should return provided data from repository methods', async () => {
      // Arrange
      const testData = { id: 'test-id', name: 'test-name' };

      // Act
      const repository = TestHelpers.createMockRepository(testData);
      const result = await repository.findByAzureAdObjectId('test-id');

      // Assert
      expect(result).toBe(testData);
    });
  });

  describe('wait', () => {
    it('should wait for the specified amount of time', async () => {
      // Arrange
      const startTime = Date.now();
      const waitTime = 100;

      // Act
      await TestHelpers.wait(waitTime);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeGreaterThanOrEqual(waitTime);
    });
  });
});
