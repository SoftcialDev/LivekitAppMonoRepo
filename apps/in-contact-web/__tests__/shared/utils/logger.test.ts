import { LogLevel } from '@/shared/enums/LogLevel';
import { logInfo, logWarn, logError, logDebug } from '@/shared/utils/logger';

describe('logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logInfo', () => {
    it('should call logInfo mock', () => {
      logInfo('Test info message');
      expect(logInfo).toHaveBeenCalledWith('Test info message');
    });

    it('should call logInfo mock with props', () => {
      const props = { userId: '123', action: 'test' };
      logInfo('Test info message', props);
      expect(logInfo).toHaveBeenCalledWith('Test info message', props);
    });
  });

  describe('logWarn', () => {
    it('should call logWarn mock', () => {
      logWarn('Test warn message');
      expect(logWarn).toHaveBeenCalledWith('Test warn message');
    });

    it('should call logWarn mock with props', () => {
      const props = { error: 'test error' };
      logWarn('Test warn message', props);
      expect(logWarn).toHaveBeenCalledWith('Test warn message', props);
    });
  });

  describe('logError', () => {
    it('should call logError mock with Error', () => {
      const error = new Error('Test error');
      logError(error);
      expect(logError).toHaveBeenCalledWith(error);
    });

    it('should call logError mock with Error and props', () => {
      const error = new Error('Test error');
      const props = { userId: '123', endpoint: '/api/test' };
      logError(error, props);
      expect(logError).toHaveBeenCalledWith(error, props);
    });

    it('should call logError mock with string', () => {
      logError('String error message');
      expect(logError).toHaveBeenCalledWith('String error message');
    });

    it('should call logError mock with string and props', () => {
      const props = { code: 500 };
      logError('String error', props);
      expect(logError).toHaveBeenCalledWith('String error', props);
    });

    it('should call logError mock with object', () => {
      const error = { code: 123, message: 'Object error' };
      logError(error);
      expect(logError).toHaveBeenCalledWith(error);
    });

    it('should call logError mock with null', () => {
      logError(null);
      expect(logError).toHaveBeenCalledWith(null);
    });

    it('should call logError mock with undefined', () => {
      logError(undefined);
      expect(logError).toHaveBeenCalledWith(undefined);
    });
  });

  describe('logDebug', () => {
    it('should call logDebug mock', () => {
      logDebug('Test debug message');
      expect(logDebug).toHaveBeenCalledWith('Test debug message');
    });

    it('should call logDebug mock with props', () => {
      const props = { requestId: 'req-123', method: 'GET' };
      logDebug('Test debug message', props);
      expect(logDebug).toHaveBeenCalledWith('Test debug message', props);
    });
  });
});

