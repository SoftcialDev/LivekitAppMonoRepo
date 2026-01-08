/**
 * @fileoverview errorLogDecorator - Decorator for automatic error logging
 * @description Provides a decorator pattern for automatically logging errors from method calls
 */

import { IErrorLogService } from '../domain/interfaces/IErrorLogService';
import { ErrorSource } from '../domain/enums/ErrorSource';

/**
 * Decorator that automatically logs errors from method execution
 * Errors are logged but do not prevent the error from being re-thrown
 * @param endpoint - Endpoint name where the error occurred
 * @param functionName - Function name where the error occurred
 * @returns Decorator function
 */
export function withErrorLogging(
  endpoint: string,
  functionName: string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: { errorLogService?: IErrorLogService }, ...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        try {
          const errorLogService = this.errorLogService;
          
          if (errorLogService) {
            await errorLogService.logError({
              source: ErrorSource.Unknown,
              endpoint,
              functionName,
              error,
              context: {
                method: propertyKey,
                argsCount: args.length
              }
            });
          }
        } catch {
          // Failed to log error - fail silently to avoid infinite loop
        }
        
        throw error;
      }
    };

    return descriptor;
  };
}

