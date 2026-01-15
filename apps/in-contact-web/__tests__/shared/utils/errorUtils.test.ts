import { AxiosError } from 'axios';
import {
  extractErrorMessage,
  isApiError,
  extractErrorStatusCode,
  handleApiError,
} from '@/shared/utils/errorUtils';
import { ApiError, UnauthorizedError, ServerError } from '@/shared/errors';
import { logError } from '@/shared/utils/logger';

// Mock logger
jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
}));

describe('errorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractErrorMessage', () => {
    it('should extract message from ApiError instance', () => {
      const apiError = new ApiError('API error message', 400);
      const message = extractErrorMessage(apiError, 'Default message');
      expect(message).toBe('API error message');
    });

    it('should return null message if ApiError has empty message', () => {
      const apiError = new ApiError('   ', 400);
      const message = extractErrorMessage(apiError, 'Default message');
      expect(message).toBe('Default message');
    });

    it('should extract message from AxiosError response data (error field)', () => {
      // Create a proper AxiosError instance
      const axiosError = new AxiosError('Axios error');
      axiosError.response = {
        data: {
          error: 'API error from server',
        },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      const message = extractErrorMessage(axiosError, 'Default message');
      expect(message).toBe('API error from server');
    });

    it('should extract message from AxiosError response data (message field)', () => {
      const axiosError = new AxiosError('Axios error');
      axiosError.response = {
        data: {
          message: 'API message from server',
        },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      const message = extractErrorMessage(axiosError, 'Default message');
      expect(message).toBe('API message from server');
    });

    it('should prefer error field over message field in AxiosError', () => {
      const axiosError = new AxiosError('Axios error');
      axiosError.response = {
        data: {
          error: 'Error field',
          message: 'Message field',
        },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      const message = extractErrorMessage(axiosError, 'Default message');
      expect(message).toBe('Error field');
    });

    it('should return default if AxiosError has empty error fields', () => {
      const axiosError = {
        response: {
          data: {
            error: '   ',
            message: '   ',
          },
        },
      } as unknown as AxiosError;
      const message = extractErrorMessage(axiosError, 'Default message');
      expect(message).toBe('Default message');
    });

    it('should extract message from standard Error instance', () => {
      const error = new Error('Standard error message');
      const message = extractErrorMessage(error, 'Default message');
      expect(message).toBe('Standard error message');
    });

    it('should return default if Error has empty message', () => {
      const error = new Error('   ');
      const message = extractErrorMessage(error, 'Default message');
      expect(message).toBe('Default message');
    });

    it('should extract message from string error', () => {
      const message = extractErrorMessage('String error message', 'Default message');
      expect(message).toBe('String error message');
    });

    it('should return default if string error is empty', () => {
      const message = extractErrorMessage('   ', 'Default message');
      expect(message).toBe('Default message');
    });

    it('should return default for unknown error types', () => {
      const message = extractErrorMessage({ some: 'object' }, 'Default message');
      expect(message).toBe('Default message');
    });

    it('should return default for null/undefined errors', () => {
      expect(extractErrorMessage(null, 'Default message')).toBe('Default message');
      expect(extractErrorMessage(undefined, 'Default message')).toBe('Default message');
    });

    it('should use default message when no error message can be extracted', () => {
      const message = extractErrorMessage(123, 'Default message');
      expect(message).toBe('Default message');
    });

    it('should prioritize ApiError over AxiosError', () => {
      const apiError = new ApiError('API error', 400);
      const axiosError = {
        response: {
          data: { error: 'Axios error' },
        },
      } as unknown as AxiosError;
      
      // When both are present, ApiError should be checked first
      const message = extractErrorMessage(apiError, 'Default');
      expect(message).toBe('API error');
    });
  });

  describe('isApiError', () => {
    it('should return true for ApiError instance', () => {
      const error = new ApiError('Error message', 400);
      expect(isApiError(error)).toBe(true);
    });

    it('should return true for UnauthorizedError instance', () => {
      const error = new UnauthorizedError('Unauthorized');
      expect(isApiError(error)).toBe(true);
    });

    it('should return true for ServerError instance', () => {
      const error = new ServerError('Server error', 500);
      expect(isApiError(error)).toBe(true);
    });

    it('should return false for standard Error instance', () => {
      const error = new Error('Standard error');
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for Error with statusCode but wrong constructor name', () => {
      const error = Object.assign(new Error('Error'), {
        statusCode: 400,
        response: {},
      });
      // Error constructor name is 'Error', not a subclass
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isApiError('string')).toBe(false);
      expect(isApiError(123)).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
      expect(isApiError({})).toBe(false);
    });

    it('should return false for Error without statusCode', () => {
      const error = new Error('Error without statusCode');
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for Error without response', () => {
      const error = Object.assign(new Error('Error'), {
        statusCode: 400,
      });
      expect(isApiError(error)).toBe(false);
    });
  });

  describe('extractErrorStatusCode', () => {
    it('should extract status code from ApiError', () => {
      const error = new ApiError('Error', 404);
      const statusCode = extractErrorStatusCode(error);
      expect(statusCode).toBe(404);
    });

    it('should extract status code from UnauthorizedError', () => {
      const error = new UnauthorizedError('Unauthorized');
      const statusCode = extractErrorStatusCode(error);
      expect(statusCode).toBe(401);
    });

    it('should extract status code from AxiosError response', () => {
      const axiosError = new AxiosError('Axios error');
      axiosError.response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        headers: {},
        config: {} as any,
      };
      const statusCode = extractErrorStatusCode(axiosError);
      expect(statusCode).toBe(500);
    });

    it('should return undefined for standard Error', () => {
      const error = new Error('Standard error');
      const statusCode = extractErrorStatusCode(error);
      expect(statusCode).toBeUndefined();
    });

    it('should return undefined for AxiosError without response', () => {
      const axiosError = {} as AxiosError;
      const statusCode = extractErrorStatusCode(axiosError);
      expect(statusCode).toBeUndefined();
    });

    it('should return undefined for non-Error types', () => {
      expect(extractErrorStatusCode('string')).toBeUndefined();
      expect(extractErrorStatusCode(123)).toBeUndefined();
      expect(extractErrorStatusCode(null)).toBeUndefined();
      expect(extractErrorStatusCode(undefined)).toBeUndefined();
    });

    it('should prioritize ApiError over AxiosError', () => {
      const apiError = new ApiError('Error', 403);
      const axiosError = {
        response: { status: 500 },
      } as unknown as AxiosError;
      
      // When checking ApiError, should return its statusCode
      const statusCode = extractErrorStatusCode(apiError);
      expect(statusCode).toBe(403);
    });
  });

  describe('handleApiError', () => {
    it('should re-throw ApiError instances', () => {
      const apiError = new ApiError('API error', 400);
      
      expect(() => {
        handleApiError('test operation', apiError, 'Default message');
      }).toThrow(apiError);
      
      expect(logError).toHaveBeenCalledWith('Failed to test operation', {
        error: apiError,
      });
    });

    it('should wrap non-ApiError Error instances in ApiError', () => {
      const error = new Error('Standard error');
      
      expect(() => {
        handleApiError('test operation', error, 'Default message');
      }).toThrow(ApiError);
      
      expect(logError).toHaveBeenCalledWith('Failed to test operation', {
        error,
      });
      
      try {
        handleApiError('test operation', error, 'Default message');
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(ApiError);
        expect((thrownError as ApiError).message).toBe('Default message');
        expect((thrownError as ApiError).statusCode).toBe(500);
        expect((thrownError as ApiError).cause).toBe(error);
      }
    });

    it('should wrap non-Error types in ApiError', () => {
      const error = 'String error';
      
      expect(() => {
        handleApiError('test operation', error, 'Default message');
      }).toThrow(ApiError);
      
      expect(logError).toHaveBeenCalledWith('Failed to test operation', {
        error,
      });
      
      try {
        handleApiError('test operation', error, 'Default message');
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(ApiError);
        expect((thrownError as ApiError).message).toBe('Default message');
        expect((thrownError as ApiError).statusCode).toBe(500);
        expect((thrownError as ApiError).cause).toBeInstanceOf(Error);
        expect((thrownError as ApiError).cause?.message).toBe('String error');
      }
    });

    it('should include context in log call', () => {
      const error = new Error('Error');
      const context = { userId: '123', action: 'test' };
      
      expect(() => {
        handleApiError('test operation', error, 'Default message', context);
      }).toThrow(ApiError);
      
      expect(logError).toHaveBeenCalledWith('Failed to test operation', {
        error,
        userId: '123',
        action: 'test',
      });
    });

    it('should handle null/undefined errors', () => {
      expect(() => {
        handleApiError('test operation', null, 'Default message');
      }).toThrow(ApiError);
      
      expect(() => {
        handleApiError('test operation', undefined, 'Default message');
      }).toThrow(ApiError);
    });

    it('should handle object errors', () => {
      const error = { code: 123, message: 'Object error' };
      
      expect(() => {
        handleApiError('test operation', error, 'Default message');
      }).toThrow(ApiError);
      
      try {
        handleApiError('test operation', error, 'Default message');
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(ApiError);
        expect((thrownError as ApiError).cause).toBeInstanceOf(Error);
        // The error object is stringified, so it will contain the JSON representation
        expect((thrownError as ApiError).cause?.message).toBe('[object Object]');
      }
    });
  });
});

