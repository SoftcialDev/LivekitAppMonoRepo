import { Context } from '@azure/functions';
import { ErrorResponseBuilder } from '../../../src/utils/error/ErrorResponseBuilder';
import { ExpectedError } from '../../../src/middleware/errorHandler';
import { DomainError } from '../../../src/domain/errors';
import { TestUtils } from '../../setup';

describe('ErrorResponseBuilder', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    jest.clearAllMocks();
  });

  describe('buildExpectedErrorResponse', () => {
    it('should build response for ExpectedError', () => {
      const error = new ExpectedError('Validation failed', 400, { field: 'email' });

      ErrorResponseBuilder.buildExpectedErrorResponse(error, mockContext);

      expect(mockContext.res?.status).toBe(400);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({
        error: 'Validation failed',
        details: { field: 'email' },
      });
    });

    it('should build response for ExpectedError without details', () => {
      const error = new ExpectedError('Not found', 404);

      ErrorResponseBuilder.buildExpectedErrorResponse(error, mockContext);

      expect(mockContext.res?.status).toBe(404);
      expect(mockContext.res?.body).toEqual({
        error: 'Not found',
      });
    });

    it('should build response for DomainError', () => {
      class TestDomainError extends DomainError {
        constructor(message: string) {
          super(message, 403);
        }
      }

      const error = new TestDomainError('Forbidden');

      ErrorResponseBuilder.buildExpectedErrorResponse(error, mockContext);

      expect(mockContext.res?.status).toBe(403);
      expect(mockContext.res?.body).toEqual({
        error: 'Forbidden',
      });
    });

    it('should skip when req is missing', () => {
      const error = new ExpectedError('Error', 400);
      const originalRes = mockContext.res;
      mockContext.req = undefined as any;

      ErrorResponseBuilder.buildExpectedErrorResponse(error, mockContext);

      expect(mockContext.res).toBe(originalRes);
    });

    it('should skip when response already populated', () => {
      const error = new ExpectedError('Error', 400);
      mockContext.res = { status: 200, body: 'Already set' };

      ErrorResponseBuilder.buildExpectedErrorResponse(error, mockContext);

      expect(mockContext.res?.status).toBe(200);
      expect(mockContext.log.warn).toHaveBeenCalledWith(
        'Response already populated before ExpectedError; skipping override'
      );
    });
  });

  describe('buildUnexpectedErrorResponse', () => {
    it('should build response for unexpected error', () => {
      const error = new Error('Internal error');
      const options = {
        genericMessage: 'Something went wrong',
        showStackInDev: false,
        isProd: () => true,
      };

      ErrorResponseBuilder.buildUnexpectedErrorResponse(error, mockContext, options);

      expect(mockContext.res?.status).toBe(500);
      expect(mockContext.res?.headers?.['Content-Type']).toBe('application/json');
      expect(mockContext.res?.body).toEqual({
        error: 'Something went wrong',
      });
    });

    it('should include stack trace in development', () => {
      const error = new Error('Internal error');
      error.stack = 'Error stack trace';
      const options = {
        genericMessage: 'Internal error',
        showStackInDev: true,
        isProd: () => false,
      };

      ErrorResponseBuilder.buildUnexpectedErrorResponse(error, mockContext, options);

      expect(mockContext.res?.body).toEqual({
        error: 'Internal error',
        stack: 'Error stack trace',
      });
    });

    it('should use default message when not provided', () => {
      const error = new Error('Internal error');
      const options = {
        genericMessage: undefined,
        showStackInDev: false,
        isProd: () => true,
      };

      ErrorResponseBuilder.buildUnexpectedErrorResponse(error, mockContext, options);

      expect(mockContext.res?.body).toEqual({
        error: 'Internal Server Error',
      });
    });

    it('should skip when req is missing', () => {
      const error = new Error('Error');
      const originalRes = mockContext.res;
      mockContext.req = undefined as any;

      ErrorResponseBuilder.buildUnexpectedErrorResponse(error, mockContext, {
        genericMessage: 'Error',
        showStackInDev: false,
        isProd: () => true,
      });

      expect(mockContext.res).toBe(originalRes);
    });

    it('should skip when response already populated', () => {
      const error = new Error('Error');
      mockContext.res = { status: 200, body: 'Already set' };

      ErrorResponseBuilder.buildUnexpectedErrorResponse(error, mockContext, {
        genericMessage: 'Error',
        showStackInDev: false,
        isProd: () => true,
      });

      expect(mockContext.res?.status).toBe(200);
      expect(mockContext.log.warn).toHaveBeenCalledWith(
        'Response already populated; skipping setting 500 response'
      );
    });

    it('should not include stack for non-Error types', () => {
      const error = 'String error';
      const options = {
        genericMessage: 'Error',
        showStackInDev: true,
        isProd: () => false,
      };

      ErrorResponseBuilder.buildUnexpectedErrorResponse(error, mockContext, options);

      expect(mockContext.res?.body).toEqual({
        error: 'Error',
      });
      expect(mockContext.res?.body).not.toHaveProperty('stack');
    });
  });
});

