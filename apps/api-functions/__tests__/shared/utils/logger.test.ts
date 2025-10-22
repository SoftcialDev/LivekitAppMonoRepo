import { logInfo, logWarn, logError, logDebug } from '../../../shared/utils/logger';
import { Context } from '@azure/functions';

describe('logger', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        verbose: jest.fn()
      }
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logInfo', () => {
    it('should log info message without props', () => {
      const message = 'Test info message';
      
      logInfo(mockContext, message);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(message);
      expect(mockContext.log.info).toHaveBeenCalledTimes(1);
    });

    it('should log info message with props', () => {
      const message = 'Test info message';
      const props = { userId: '123', action: 'test' };
      
      logInfo(mockContext, message, props);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(message, props);
      expect(mockContext.log.info).toHaveBeenCalledTimes(1);
    });

    it('should handle empty props object', () => {
      const message = 'Test info message';
      const props = {};
      
      logInfo(mockContext, message, props);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(message, props);
    });

    it('should handle complex props', () => {
      const message = 'Test info message';
      const props = {
        user: { id: '123', name: 'John' },
        metadata: { timestamp: new Date(), count: 42 }
      };
      
      logInfo(mockContext, message, props);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(message, props);
    });
  });

  describe('logWarn', () => {
    it('should log warning message without props', () => {
      const message = 'Test warning message';
      
      logWarn(mockContext, message);
      
      expect(mockContext.log.warn).toHaveBeenCalledWith(message);
      expect(mockContext.log.warn).toHaveBeenCalledTimes(1);
    });

    it('should log warning message with props', () => {
      const message = 'Test warning message';
      const props = { warningType: 'deprecated', version: '1.0' };
      
      logWarn(mockContext, message, props);
      
      expect(mockContext.log.warn).toHaveBeenCalledWith(message, props);
      expect(mockContext.log.warn).toHaveBeenCalledTimes(1);
    });

    it('should handle null props', () => {
      const message = 'Test warning message';
      
      logWarn(mockContext, message, null as any);
      
      expect(mockContext.log.warn).toHaveBeenCalledWith(message);
    });
  });

  describe('logError', () => {
    it('should log Error instance with message and stack', () => {
      const error = new Error('Test error message');
      error.stack = 'Error stack trace';
      
      logError(mockContext, error);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Test error message',
        { message: 'Test error message', stack: 'Error stack trace' }
      );
      expect(mockContext.log.error).toHaveBeenCalledTimes(1);
    });

    it('should log Error instance with additional props', () => {
      const error = new Error('Test error message');
      error.stack = 'Error stack trace';
      const props = { userId: '123', action: 'test' };
      
      logError(mockContext, error, props);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Test error message',
        { message: 'Test error message', stack: 'Error stack trace', userId: '123', action: 'test' }
      );
    });

    it('should log string error message', () => {
      const errorMessage = 'String error message';
      
      logError(mockContext, errorMessage);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(errorMessage, undefined);
    });

    it('should log string error message with props', () => {
      const errorMessage = 'String error message';
      const props = { errorCode: 'E001' };
      
      logError(mockContext, errorMessage, props);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(errorMessage, props);
    });

    it('should log non-string, non-Error objects as JSON', () => {
      const errorObj = { code: 500, message: 'Server error' };
      
      logError(mockContext, errorObj);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(
        JSON.stringify(errorObj),
        undefined
      );
    });

    it('should log non-string, non-Error objects with props', () => {
      const errorObj = { code: 500, message: 'Server error' };
      const props = { context: 'test' };
      
      logError(mockContext, errorObj, props);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(
        JSON.stringify(errorObj),
        props
      );
    });

    it('should handle null error', () => {
      logError(mockContext, null);
      
      expect(mockContext.log.error).toHaveBeenCalledWith('null', undefined);
    });

    it('should handle undefined error', () => {
      logError(mockContext, undefined);
      
      expect(mockContext.log.error).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should handle number error', () => {
      logError(mockContext, 404);
      
      expect(mockContext.log.error).toHaveBeenCalledWith('404', undefined);
    });

    it('should handle boolean error', () => {
      logError(mockContext, false);
      
      expect(mockContext.log.error).toHaveBeenCalledWith('false', undefined);
    });
  });

  describe('logDebug', () => {
    it('should log debug message without props', () => {
      const message = 'Test debug message';
      
      logDebug(mockContext, message);
      
      expect(mockContext.log.verbose).toHaveBeenCalledWith(message);
      expect(mockContext.log.verbose).toHaveBeenCalledTimes(1);
    });

    it('should log debug message with props', () => {
      const message = 'Test debug message';
      const props = { debugLevel: 'verbose', component: 'auth' };
      
      logDebug(mockContext, message, props);
      
      expect(mockContext.log.verbose).toHaveBeenCalledWith(message, props);
      expect(mockContext.log.verbose).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string message', () => {
      logDebug(mockContext, '');
      
      expect(mockContext.log.verbose).toHaveBeenCalledWith('');
    });

    it('should handle long debug message', () => {
      const longMessage = 'A'.repeat(1000);
      
      logDebug(mockContext, longMessage);
      
      expect(mockContext.log.verbose).toHaveBeenCalledWith(longMessage);
    });
  });

  describe('edge cases', () => {
    it('should handle all logging functions with same context', () => {
      const message = 'Test message';
      const props = { test: true };
      
      logInfo(mockContext, message, props);
      logWarn(mockContext, message, props);
      logError(mockContext, message, props);
      logDebug(mockContext, message, props);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(message, props);
      expect(mockContext.log.warn).toHaveBeenCalledWith(message, props);
      expect(mockContext.log.error).toHaveBeenCalledWith(message, props);
      expect(mockContext.log.verbose).toHaveBeenCalledWith(message, props);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      logInfo(mockContext, specialMessage);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(specialMessage);
    });

    it('should handle unicode characters in messages', () => {
      const unicodeMessage = 'Test message with unicode: ñáéíóú 中文 🚀';
      
      logInfo(mockContext, unicodeMessage);
      
      expect(mockContext.log.info).toHaveBeenCalledWith(unicodeMessage);
    });
  });
});
