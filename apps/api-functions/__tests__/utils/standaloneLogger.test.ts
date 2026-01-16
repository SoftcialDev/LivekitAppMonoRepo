import { logInfo, logWarn, logError } from '../../src/utils/standaloneLogger';

describe('standaloneLogger', () => {
  let originalStdout: typeof process.stdout.write;
  let originalStderr: typeof process.stderr.write;
  let stdoutOutput: string[];
  let stderrOutput: string[];

  beforeEach(() => {
    stdoutOutput = [];
    stderrOutput = [];
    originalStdout = process.stdout.write;
    originalStderr = process.stderr.write;

    process.stdout.write = jest.fn((chunk: any) => {
      stdoutOutput.push(chunk.toString());
      return true;
    }) as any;

    process.stderr.write = jest.fn((chunk: any) => {
      stderrOutput.push(chunk.toString());
      return true;
    }) as any;
  });

  afterEach(() => {
    process.stdout.write = originalStdout;
    process.stderr.write = originalStderr;
  });

  describe('logInfo', () => {
    it('should log info message', () => {
      logInfo('Test message');

      expect(stdoutOutput.length).toBe(1);
      const logEntry = JSON.parse(stdoutOutput[0]);
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log info message with props', () => {
      const props = { userId: 'user-1', action: 'test' };

      logInfo('Test message', props);

      const logEntry = JSON.parse(stdoutOutput[0]);
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.userId).toBe('user-1');
      expect(logEntry.action).toBe('test');
    });
  });

  describe('logWarn', () => {
    it('should log warning message', () => {
      logWarn('Warning message');

      expect(stdoutOutput.length).toBe(1);
      const logEntry = JSON.parse(stdoutOutput[0]);
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.message).toBe('Warning message');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log warning message with props', () => {
      const props = { userId: 'user-1' };

      logWarn('Warning message', props);

      const logEntry = JSON.parse(stdoutOutput[0]);
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.userId).toBe('user-1');
    });
  });

  describe('logError', () => {
    it('should log Error instance', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logError(error);

      expect(stderrOutput.length).toBe(1);
      const logEntry = JSON.parse(stderrOutput[0]);
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Test error');
      expect(logEntry.stack).toBe('Error stack trace');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log string error', () => {
      logError('String error');

      const logEntry = JSON.parse(stderrOutput[0]);
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('String error');
      expect(logEntry.stack).toBeUndefined();
    });

    it('should log unknown error type', () => {
      logError(123);

      const logEntry = JSON.parse(stderrOutput[0]);
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('123');
      expect(logEntry.error).toBe(123);
    });

    it('should log error with props', () => {
      const error = new Error('Test error');
      const props = { userId: 'user-1', endpoint: '/api/test' };

      logError(error, props);

      const logEntry = JSON.parse(stderrOutput[0]);
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Test error');
      expect(logEntry.userId).toBe('user-1');
      expect(logEntry.endpoint).toBe('/api/test');
    });
  });
});



