import { withErrorLogging } from '../../src/utils/errorLogDecorator';
import { IErrorLogService } from '../../src/domain/interfaces/IErrorLogService';
import { ErrorSource } from '../../src/domain/enums/ErrorSource';

describe('errorLogDecorator', () => {
  let mockErrorLogService: jest.Mocked<IErrorLogService>;

  beforeEach(() => {
    mockErrorLogService = {
      logError: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  describe('withErrorLogging', () => {
    it('should execute method successfully without logging', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async testMethod(arg1: string, arg2: number): Promise<string> {
          return `result-${arg1}-${arg2}`;
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.testMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'testMethod', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'testMethod', decorated);
      }

      const instance = new TestClass();
      instance.errorLogService = mockErrorLogService;

      const result = await instance.testMethod('test', 123);

      expect(result).toBe('result-test-123');
      expect(mockErrorLogService.logError).not.toHaveBeenCalled();
    });

    it('should log error when method throws', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async failingMethod(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.failingMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'failingMethod', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'failingMethod', decorated);
      }

      const instance = new TestClass();
      instance.errorLogService = mockErrorLogService;

      await expect(instance.failingMethod()).rejects.toThrow('Test error');

      expect(mockErrorLogService.logError).toHaveBeenCalledWith({
        source: ErrorSource.Unknown,
        endpoint: 'test-endpoint',
        functionName: 'testFunction',
        error: expect.any(Error),
        context: {
          method: 'failingMethod',
          argsCount: 0,
        },
      });
    });

    it('should re-throw error after logging', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async failingMethod(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.failingMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'failingMethod', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'failingMethod', decorated);
      }

      const instance = new TestClass();
      instance.errorLogService = mockErrorLogService;

      await expect(instance.failingMethod()).rejects.toThrow('Test error');
      expect(mockErrorLogService.logError).toHaveBeenCalled();
    });

    it('should handle method with arguments', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async failingMethod(arg1: string): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.failingMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'failingMethod', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'failingMethod', decorated);
      }

      const instance = new TestClass();
      instance.errorLogService = mockErrorLogService;

      await expect(instance.failingMethod('arg1')).rejects.toThrow();

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            argsCount: 1,
          }),
        })
      );
    });

    it('should not log when errorLogService is not available', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async methodWithoutErrorService(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.methodWithoutErrorService,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'methodWithoutErrorService', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'methodWithoutErrorService', decorated);
      }

      const instance = new TestClass();

      await expect(instance.methodWithoutErrorService()).rejects.toThrow('Test error');

      expect(mockErrorLogService.logError).not.toHaveBeenCalled();
    });

    it('should fail silently if logging throws an error', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async failingMethod(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.failingMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'failingMethod', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'failingMethod', decorated);
      }

      const instance = new TestClass();
      instance.errorLogService = {
        logError: jest.fn().mockRejectedValue(new Error('Logging failed')),
      } as any;

      await expect(instance.failingMethod()).rejects.toThrow('Test error');
    });

    it('should include correct method name in context', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async failingMethod(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      const descriptor = {
        value: TestClass.prototype.failingMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const decorated = decorator(TestClass, 'failingMethod', descriptor);
      if (decorated) {
        Object.defineProperty(TestClass.prototype, 'failingMethod', decorated);
      }

      const instance = new TestClass();
      instance.errorLogService = mockErrorLogService;

      await expect(instance.failingMethod()).rejects.toThrow();

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            method: 'failingMethod',
          }),
        })
      );
    });

    it('should include correct args count in context', async () => {
      class TestClass {
        errorLogService?: IErrorLogService;

        async testMethod(arg1: string, arg2: number): Promise<string> {
          return `result-${arg1}-${arg2}`;
        }

        async failingMethod(): Promise<string> {
          throw new Error('Test error');
        }
      }

      const decorator = withErrorLogging('test-endpoint', 'testFunction');
      
      const testDescriptor = {
        value: TestClass.prototype.testMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const testDecorated = decorator(TestClass, 'testMethod', testDescriptor);
      if (testDecorated) {
        Object.defineProperty(TestClass.prototype, 'testMethod', testDecorated);
      }

      const failDescriptor = {
        value: TestClass.prototype.failingMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      };
      const failDecorated = decorator(TestClass, 'failingMethod', failDescriptor);
      if (failDecorated) {
        Object.defineProperty(TestClass.prototype, 'failingMethod', failDecorated);
      }

      const instance = new TestClass();
      instance.errorLogService = mockErrorLogService;

      await expect(instance.testMethod('arg1', 123)).resolves.toBe('result-arg1-123');

      await expect(instance.failingMethod()).rejects.toThrow();

      expect(mockErrorLogService.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            argsCount: 0,
          }),
        })
      );
    });
  });
});
