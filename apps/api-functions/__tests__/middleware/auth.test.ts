import { Context } from '@azure/functions';
import jwt from 'jsonwebtoken';
import { withAuth } from '../../src/middleware/auth';
import { config } from '../../src/config';
import { TestUtils } from '../setup';

const mockJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

const mockGetSigningKeyFn = jest.fn((kid: string, callback: any) => {
  callback(null, {
    getPublicKey: () => 'mock-public-key',
  } as any);
});

jest.mock('jwks-rsa', () => {
  const mockFn = jest.fn((kid: string, callback: any) => {
    callback(null, {
      getPublicKey: () => 'mock-public-key',
    } as any);
  });
  return jest.fn(() => ({
    getSigningKey: mockFn,
  }));
});

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

      mockJwtVerify.mockImplementation((token, getKey, opts, callback: any) => {
        callback(null, decodedPayload);
      });

      await withAuth(mockContext, mockNext);

      expect(mockJwtVerify).toHaveBeenCalled();
      expect(mockContext.bindings.user).toEqual(decodedPayload);
      expect(mockNext).toHaveBeenCalled();
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

    it('should return 401 if token verification fails', async () => {
      const token = 'invalid-token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      mockJwtVerify.mockImplementation((token, getKey, opts, callback: any) => {
        callback(new Error('Token verification failed'), null);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toHaveProperty('error');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token payload is invalid', async () => {
      const token = 'token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      mockJwtVerify.mockImplementation((token, getKey, opts, callback: any) => {
        callback(null, 'invalid-payload');
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.body).toHaveProperty('error');
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

    it('should handle JWKS client errors', async () => {
      const token = 'token';
      
      mockContext.req = TestUtils.createMockHttpRequest({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const mockJwksClient = require('jwks-rsa');
      const mockInstance = mockJwksClient({});
      mockInstance.getSigningKey.mockImplementationOnce((kid: string, callback: any) => {
        callback(new Error('JWKS error'), undefined);
      });

      mockJwtVerify.mockImplementation((token, getKey, opts, callback: any) => {
        const header = { alg: 'RS256', kid: 'test-kid' };
        (getKey as any)(header, (err: Error | null) => {
          if (err) {
            callback(err, null);
          } else {
            callback(null, { sub: 'user-id' });
          }
        });
      });

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

      mockJwtVerify.mockImplementation((token, getKey, opts, callback: any) => {
        const header = { alg: 'RS256' };
        (getKey as any)(header, (err: Error | null) => {
          if (err) {
            callback(err, null);
          } else {
            callback(null, { sub: 'user-id' });
          }
        });
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
