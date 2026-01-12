/**
 * @fileoverview LazySingletonProxy - Utility for creating lazy-initialized singleton proxies
 * @summary Generic utility to wrap singleton instances with lazy initialization
 * @description Provides a reusable pattern for singletons that need to delay initialization
 * until config is available, while maintaining optimal performance after first access.
 * This utility encapsulates the proxy pattern to avoid code duplication across singleton services.
 */

import { LazySingletonProxyOptions } from '../../domain/types/SingletonTypes';

/**
 * Factory function that creates a lazy-initialized proxy for singleton instances
 * @description Creates a Proxy that delays singleton initialization until first access,
 * ensuring config dependencies are available. After first initialization, subsequent
 * accesses use the cached instance directly for optimal performance.
 * @param factory - Function that creates the singleton instance when called
 * @param options - Optional configuration for the proxy (e.g., reset function)
 * @returns Proxy that lazily initializes the instance on first access with optional reset method
 * @example
 * const proxy = createLazySingletonProxy(
 *   () => MySingleton.getInstance(),
 *   { reset: () => MySingleton.reset() }
 * );
 * // First access: initializes instance
 * proxy.someMethod();
 * // Subsequent accesses: uses cached instance (zero proxy overhead)
 * proxy.anotherMethod();
 */
export function createLazySingletonProxy<T extends object>(
  factory: () => T,
  options?: LazySingletonProxyOptions
): T & { reset?: () => void } {
  let cachedInstance: T | undefined;
  
  const reset = () => {
    cachedInstance = undefined;
    options?.reset?.();
  };
  
  const proxy = new Proxy({} as T, {
    get(_target, prop) {
      // Special handling for reset method
      if (prop === 'reset') {
        return reset;
      }
      
      // Initialize on first access only (lazy initialization)
      cachedInstance ??= factory();
      
      // After first access, cachedInstance is guaranteed to exist
      // Direct property access for optimal performance
      const value = cachedInstance[prop as keyof T];
      
      // Bind functions to maintain correct 'this' context
      if (typeof value === 'function') {
        return value.bind(cachedInstance);
      }
      
      return value;
    }
  });
  
  return proxy as T & { reset?: () => void };
}

