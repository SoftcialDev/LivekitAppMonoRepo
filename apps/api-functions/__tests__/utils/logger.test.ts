import { Context } from '@azure/functions';
import { logInfo, logWarn, logError, logDebug } from '../../src/utils/logger';
import { TestUtils } from '../setup';

describe('logger', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = TestUtils.createMockContext();
    jest.clearAllMocks();
  });

  describe('logInfo', () => {
    it('should log info message without props', () => {
      logInfo(mockContext, 'Test message');
      expect(mockContext.log.info).toHaveBeenCalledWith('Test message');
    });

    it('should log info message with props', () => {
      const props = { userId: 'user-123', action: 'test' };
      logInfo(mockContext, 'Test message', props);
      expect(mockContext.log.info).toHaveBeenCalledWith('Test message', props);
    });
  });

  describe('logWarn', () => {
    it('should log warning message without props', () => {
      logWarn(mockContext, 'Warning message');
      expect(mockContext.log.warn).toHaveBeenCalledWith('Warning message');
    });

    it('should log warning message with props', () => {
      const props = { userId: 'user-123', reason: 'test' };
      logWarn(mockContext, 'Warning message', props);
      expect(mockContext.log.warn).toHaveBeenCalledWith('Warning message', props);
    });
  });

  describe('logError', () => {
    it('should log Error instance with message and stack', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      const props = { userId: 'user-123' };

      logError(mockContext, error, props);

      expect(mockContext.log.error).toHaveBeenCalledWith('Test error', {
        message: 'Test error',
        stack: 'Error stack trace',
        userId: 'user-123',
      });
    });

    it('should log Error instance without props', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logError(mockContext, error);

      expect(mockContext.log.error).toHaveBeenCalledWith('Test error', {
        message: 'Test error',
        stack: 'Error stack trace',
      });
    });

    it('should log string error', () => {
      const error = 'String error message';
      const props = { userId: 'user-123' };

      logError(mockContext, error, props);

      expect(mockContext.log.error).toHaveBeenCalledWith('String error message', props);
    });

    it('should log string error without props', () => {
      const error = 'String error message';

      logError(mockContext, error);

      expect(mockContext.log.error).toHaveBeenCalledWith('String error message', undefined);
    });

    it('should log other types as JSON string', () => {
      const error = { code: 500, message: 'Custom error' };
      const props = { userId: 'user-123' };

      logError(mockContext, error, props);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        JSON.stringify(error),
        props
      );
    });

    it('should log null as JSON string', () => {
      const error = null;
      logError(mockContext, error);
      expect(mockContext.log.error).toHaveBeenCalledWith('null', undefined);
    });

    it('should log undefined as JSON string', () => {
      const error = undefined;
      logError(mockContext, error);
      expect(mockContext.log.error).toHaveBeenCalledTimes(1);
      const callArgs = (mockContext.log.error as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toBeUndefined();
    });
  });

  describe('logDebug', () => {
    it('should log debug message without props', () => {
      logDebug(mockContext, 'Debug message');
      expect(mockContext.log.verbose).toHaveBeenCalledWith('Debug message');
    });

    it('should log debug message with props', () => {
      const props = { userId: 'user-123', debug: true };
      logDebug(mockContext, 'Debug message', props);
      expect(mockContext.log.verbose).toHaveBeenCalledWith('Debug message', props);
    });
  });
});

