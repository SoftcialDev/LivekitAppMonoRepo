import { createLazySingletonProxy } from '../../../src/infrastructure/utils/LazySingletonProxy';

describe('LazySingletonProxy', () => {
  describe('createLazySingletonProxy', () => {
    it('should create proxy that calls factory on first access', () => {
      const factory = jest.fn(() => ({
        value: 'test',
        method: jest.fn(),
      }));

      const proxy = createLazySingletonProxy(factory);

      expect(factory).not.toHaveBeenCalled();

      const result = proxy.value;

      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toBe('test');
    });

    it('should call factory only once for multiple property accesses', () => {
      const factory = jest.fn(() => ({
        prop1: 'value1',
        prop2: 'value2',
      }));

      const proxy = createLazySingletonProxy(factory);

      const value1 = proxy.prop1;
      const value2 = proxy.prop2;
      const value3 = proxy.prop1;

      expect(factory).toHaveBeenCalledTimes(1);
      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(value3).toBe('value1');
    });

    it('should handle method calls', () => {
      const mockMethod = jest.fn().mockReturnValue('result');
      const factory = jest.fn(() => ({
        method: mockMethod,
      }));

      const proxy = createLazySingletonProxy(factory);

      const result = proxy.method();

      expect(factory).toHaveBeenCalledTimes(1);
      expect(mockMethod).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should handle nested property access', () => {
      const factory = jest.fn(() => ({
        nested: {
          deep: {
            value: 'deep-value',
          },
        },
      }));

      const proxy = createLazySingletonProxy(factory);

      const result = proxy.nested.deep.value;

      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toBe('deep-value');
    });

    it('should provide reset function when options.reset is provided', () => {
      const factory = jest.fn(() => ({ value: 'test' }));
      const resetFn = jest.fn();

      const proxy = createLazySingletonProxy(factory, { reset: resetFn });

      expect(proxy.reset).toBeDefined();
      expect(typeof proxy.reset).toBe('function');
    });

    it('should reset proxy when reset is called', () => {
      let callCount = 0;
      const factory = jest.fn(() => {
        callCount++;
        return { value: `test-${callCount}` };
      });
      const resetFn = jest.fn();

      const proxy = createLazySingletonProxy(factory, { reset: resetFn });

      const value1 = proxy.value;
      expect(value1).toBe('test-1');

      proxy.reset!();

      const value2 = proxy.value;
      expect(value2).toBe('test-2');
      expect(resetFn).toHaveBeenCalled();
    });

    it('should handle errors in factory', () => {
      const factory = jest.fn(() => {
        throw new Error('Factory error');
      });

      const proxy = createLazySingletonProxy(factory) as any;

      expect(() => {
        const _ = proxy.value;
      }).toThrow('Factory error');
    });

    it('should handle complex objects', () => {
      const complexObject = {
        string: 'value',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'nested-value' },
        method: jest.fn().mockReturnValue('method-result'),
      };

      const factory = jest.fn(() => complexObject);
      const proxy = createLazySingletonProxy(factory);

      expect(proxy.string).toBe('value');
      expect(proxy.number).toBe(42);
      expect(proxy.boolean).toBe(true);
      expect(proxy.array).toEqual([1, 2, 3]);
      expect(proxy.object.nested).toBe('nested-value');
      expect(proxy.method()).toBe('method-result');

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });
});

