import { Context } from '@azure/functions';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { withAuth } from '../../src/middleware/auth';
import { config } from '../../src/config';
import { TestUtils } from '../setup';

const mockJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

jest.mock('jwks-rsa', () => jest.fn(() => ({
  getSigningKey: jest.fn((kid, callback) => {
    callback(null, {
      getPublicKey: () => 'mock-public-key',
    } as any);
  }),
})));

jest.mock('../../src/config', () => ({
  config: {
    azureTenantId: 'test-tenant-id',
    azureClientId: 'test-client-id',
    node_env: 'test',
  },
}));

describe('auth middleware', () => {
  let mockContext: Context;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    mockNext = jest.fn().mockResolvedValue(undefined);

    jest.clearAllMocks();
  });

  describe('withAuth', () => {
    it('should authenticate valid JWT token and call next', async () => {
      const token = 'valid-token';
      const decodedPayload = { oid: 'user-id', email: 'user@example.com' };
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      mockJwtVerify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, decodedPayload);
        return decodedPayload as any;
      });

      await withAuth(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.bindings.user).toEqual(decodedPayload);
      expect(mockContext.bindings.accessToken).toBe(token);
    });

    it('should return 401 if Authorization header is missing', async () => {
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {},
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toEqual({ error: 'Missing or invalid Authorization header' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header does not start with Bearer', async () => {
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: 'Invalid token',
        },
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toEqual({ error: 'Missing or invalid Authorization header' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if config is missing azureTenantId', async () => {
      const originalConfig = { ...config };
      (config as any).azureTenantId = undefined;

      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: 'Bearer token',
        },
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toEqual({ error: 'Server configuration error' });
      expect(mockNext).not.toHaveBeenCalled();

      Object.assign(config, originalConfig);
    });

    it('should return 500 if config is missing azureClientId', async () => {
      const originalConfig = { ...config };
      (config as any).azureClientId = undefined;

      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: 'Bearer token',
        },
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.body).toEqual({ error: 'Server configuration error' });
      expect(mockNext).not.toHaveBeenCalled();

      Object.assign(config, originalConfig);
    });

    it('should return 401 if JWT verification fails', async () => {
      const token = 'invalid-token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      mockJwtVerify.mockImplementation((token, getKey, options, callback: any) => {
        callback(new Error('Token expired'), undefined);
        return undefined as any;
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toEqual({ error: 'Unauthorized: Token expired' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if JWT payload is a string', async () => {
      const token = 'token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      mockJwtVerify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, 'string-payload');
        return 'string-payload' as any;
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toEqual({ error: 'Unauthorized: Unexpected token payload type' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive Authorization header', async () => {
      const token = 'valid-token';
      const decodedPayload = { oid: 'user-id' };
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      mockJwtVerify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, decodedPayload);
        return decodedPayload as any;
      });

      await withAuth(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.bindings.user).toEqual(decodedPayload);
    });

    it('should handle JWKS client errors', async () => {
      const token = 'token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const mockJwksClient = jwksClient as jest.MockedFunction<typeof jwksClient>;
      const mockInstance = mockJwksClient.mock.results[0]?.value as any;
      if (mockInstance?.getSigningKey) {
        mockInstance.getSigningKey.mockImplementationOnce((kid: string, callback: any) => {
          callback(new Error('JWKS error'), undefined);
        });
      }

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toEqual({ error: 'Unauthorized: JWKS error' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing kid in JWT header', async () => {
      const token = 'token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const mockJwksClient = jwksClient as jest.MockedFunction<typeof jwksClient>;
      const mockInstance = mockJwksClient.mock.results[0]?.value as any;
      if (mockInstance?.getSigningKey) {
        mockInstance.getSigningKey.mockImplementationOnce((kid: string, callback: any) => {
          callback(new Error("JWT header is missing 'kid'"), undefined);
        });
      }

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

