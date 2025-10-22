/**
 * @fileoverview Tests for response utility functions
 * @description Tests for HTTP response helper functions
 */

import { ok, badRequest, noContent, unauthorized, forbidden, notFound } from '../../../shared/utils/response';
import { Context } from '@azure/functions';
import { TestHelpers } from '../../utils/helpers';

describe('response', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = TestHelpers.createMockContext();
  });

  describe('ok', () => {
    it('should send 200 OK with JSON body', () => {
      const data = { message: 'Success', id: 123 };
      
      ok(mockContext, data);

      expect(mockContext.res).toEqual({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: data
      });
    });

    it('should handle string data', () => {
      const data = 'Simple string response';
      
      ok(mockContext, data);

      expect(mockContext.res!.body).toBe(data);
    });

    it('should handle null data', () => {
      ok(mockContext, null);

      expect(mockContext.res!.body).toBeNull();
    });

    it('should handle undefined data', () => {
      ok(mockContext, undefined);

      expect(mockContext.res!.body).toBeUndefined();
    });

    it('should handle array data', () => {
      const data = [1, 2, 3, 'test'];
      
      ok(mockContext, data);

      expect(mockContext.res!.body).toEqual(data);
    });

    it('should handle complex object data', () => {
      const data = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ],
        meta: {
          total: 2,
          page: 1
        }
      };
      
      ok(mockContext, data);

      expect(mockContext.res!.body).toEqual(data);
    });
  });

  describe('badRequest', () => {
    it('should send 400 Bad Request with string error', () => {
      const error = 'Invalid input provided';
      
      badRequest(mockContext, error);

      expect(mockContext.res).toEqual({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error }
      });
    });

    it('should send 400 Bad Request with object error', () => {
      const error = { 
        message: 'Validation failed', 
        details: ['Field is required', 'Invalid format'] 
      };
      
      badRequest(mockContext, error);

      expect(mockContext.res).toEqual({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: error
      });
    });

    it('should handle empty string error', () => {
      badRequest(mockContext, '');

      expect(mockContext.res!.body).toEqual({ error: '' });
    });

    it('should handle complex error object', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Multiple validation errors',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' }
        ]
      };
      
      badRequest(mockContext, error);

      expect(mockContext.res!.body).toEqual(error);
    });
  });

  describe('noContent', () => {
    it('should send 204 No Content', () => {
      noContent(mockContext);

      expect(mockContext.res).toEqual({
        status: 204,
        body: null
      });
    });

    it('should not include headers', () => {
      noContent(mockContext);

      expect(mockContext.res!.headers).toBeUndefined();
    });
  });

  describe('unauthorized', () => {
    it('should send 401 Unauthorized with default message', () => {
      unauthorized(mockContext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Unauthorized' }
      });
    });

    it('should send 401 Unauthorized with custom message', () => {
      const message = 'Invalid credentials';
      
      unauthorized(mockContext, message);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: { error: message }
      });
    });

    it('should handle empty message', () => {
      unauthorized(mockContext, '');

      expect(mockContext.res!.body).toEqual({ error: '' });
    });

    it('should handle long message', () => {
      const message = 'This is a very long unauthorized message that explains the reason for the unauthorized access attempt in detail';
      
      unauthorized(mockContext, message);

      expect(mockContext.res!.body).toEqual({ error: message });
    });
  });

  describe('forbidden', () => {
    it('should send 403 Forbidden with default message', () => {
      forbidden(mockContext);

      expect(mockContext.res).toEqual({
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Forbidden' }
      });
    });

    it('should send 403 Forbidden with custom message', () => {
      const message = 'Access denied';
      
      forbidden(mockContext, message);

      expect(mockContext.res).toEqual({
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: { error: message }
      });
    });

    it('should handle empty message', () => {
      forbidden(mockContext, '');

      expect(mockContext.res!.body).toEqual({ error: '' });
    });

    it('should handle special characters in message', () => {
      const message = 'Access denied: User "admin@example.com" lacks permission for resource /api/users';
      
      forbidden(mockContext, message);

      expect(mockContext.res!.body).toEqual({ error: message });
    });
  });

  describe('notFound', () => {
    it('should send 404 Not Found with default message', () => {
      notFound(mockContext);

      expect(mockContext.res).toEqual({
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Not Found' }
      });
    });

    it('should send 404 Not Found with custom message', () => {
      const message = 'Resource not found';
      
      notFound(mockContext, message);

      expect(mockContext.res).toEqual({
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: message }
      });
    });

    it('should handle empty message', () => {
      notFound(mockContext, '');

      expect(mockContext.res!.body).toEqual({ error: '' });
    });

    it('should handle unicode characters in message', () => {
      const message = 'Recurso no encontrado: 用户不存在';
      
      notFound(mockContext, message);

      expect(mockContext.res!.body).toEqual({ error: message });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple calls on same context', () => {
      ok(mockContext, { first: 'call' });
      expect(mockContext.res!.status).toBe(200);

      badRequest(mockContext, 'Error');
      expect(mockContext.res!.status).toBe(400);
      expect(mockContext.res!.body).toEqual({ error: 'Error' });
    });

    it('should handle context with existing res properties', () => {
      mockContext.res = {
        status: 500,
        body: 'existing'
      } as any;

      ok(mockContext, { new: 'data' });

      expect(mockContext.res).toEqual({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { new: 'data' }
      });
    });
  });
});
