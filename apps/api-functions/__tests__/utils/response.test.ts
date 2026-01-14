import { Context } from '@azure/functions';
import { ok, badRequest, noContent, unauthorized, forbidden, notFound } from '../../src/utils/response';
import { TestUtils } from '../setup';

describe('response', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
  });

  describe('ok', () => {
    it('should set 200 OK response with JSON body', () => {
      const data = { message: 'Success' };

      ok(mockContext, data);

      expect(mockContext.res?.status).toBe(200);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual(data);
    });
  });

  describe('badRequest', () => {
    it('should set 400 Bad Request with string error', () => {
      const error = 'Invalid input';

      badRequest(mockContext, error);

      expect(mockContext.res?.status).toBe(400);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error });
    });

    it('should set 400 Bad Request with object error', () => {
      const error = { field: 'email', message: 'Invalid email' };

      badRequest(mockContext, error);

      expect(mockContext.res?.status).toBe(400);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual(error);
    });
  });

  describe('noContent', () => {
    it('should set 204 No Content', () => {
      noContent(mockContext);

      expect(mockContext.res?.status).toBe(204);
      expect(mockContext.res?.body).toBeNull();
    });
  });

  describe('unauthorized', () => {
    it('should set 401 Unauthorized with default message', () => {
      unauthorized(mockContext);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error: 'Unauthorized' });
    });

    it('should set 401 Unauthorized with custom message', () => {
      const message = 'Invalid token';

      unauthorized(mockContext, message);

      expect(mockContext.res?.status).toBe(401);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error: message });
    });
  });

  describe('forbidden', () => {
    it('should set 403 Forbidden with default message', () => {
      forbidden(mockContext);

      expect(mockContext.res?.status).toBe(403);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error: 'Forbidden' });
    });

    it('should set 403 Forbidden with custom message', () => {
      const message = 'Insufficient permissions';

      forbidden(mockContext, message);

      expect(mockContext.res?.status).toBe(403);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error: message });
    });
  });

  describe('notFound', () => {
    it('should set 404 Not Found with default message', () => {
      notFound(mockContext);

      expect(mockContext.res?.status).toBe(404);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error: 'Not Found' });
    });

    it('should set 404 Not Found with custom message', () => {
      const message = 'Resource not found';

      notFound(mockContext, message);

      expect(mockContext.res?.status).toBe(404);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({ error: message });
    });
  });
});

