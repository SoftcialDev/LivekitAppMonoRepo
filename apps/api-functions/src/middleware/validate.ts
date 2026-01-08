/**
 * @fileoverview validation - Unified validation middleware
 * @description Single Responsibility: Orchestrate validation for different request sources
 */

import { Context } from '@azure/functions';
import { ZodSchema } from 'zod';
import { badRequest } from '../utils/response';
import { IValidator } from '../domain/interfaces/IValidator';
import { IRequestDataExtractor } from '../domain/interfaces/IRequestDataExtractor';
import { ValidationConfig } from '../domain/types/ValidationConfig';
import { ValidationSource } from '../domain/enums/ValidationSource';
import { BindingKey } from '../domain/enums/BindingKey';
import { ZodValidator } from '../infrastructure/validation/ZodValidator';
import { RequestDataExtractor } from '../infrastructure/validation/RequestDataExtractor';
import { ensureBindings } from '../domain/types/ContextBindings';

const validator: IValidator = new ZodValidator();
const dataExtractor: IRequestDataExtractor = new RequestDataExtractor();

/**
 * Creates validation middleware for a specific request source
 * @param schema - Zod schema for validation
 * @param config - Validation configuration
 * @returns Middleware function
 */
function createValidationMiddleware<T>(
  schema: ZodSchema<T>,
  config: ValidationConfig
) {
  return async (ctx: Context, next: () => Promise<void>) => {
    if (!dataExtractor.hasHttpRequest(ctx)) {
      ctx.res = {
        status: 500,
        body: 'No HTTP request context'
      };
      return;
    }

    let data: unknown;
    try {
      switch (config.source) {
        case ValidationSource.BODY:
          data = dataExtractor.extractBody(ctx);
          if (config.required && data === undefined) {
            return badRequest(ctx, 'Request body is required');
          }
          break;
        case ValidationSource.QUERY:
          data = dataExtractor.extractQuery(ctx);
          break;
        case ValidationSource.PATH:
          data = dataExtractor.extractPath(ctx);
          break;
      }
    } catch (error) {
      ctx.res = {
        status: 500,
        body: error instanceof Error ? error.message : 'Failed to extract request data'
      };
      return;
    }

    const result = validator.validate(schema, data);

    if (!result.success) {
      const validationErrors = result.errors!.map(err => ({
        path: err.message.split(':')[0],
        message: err.message
      }));
      return badRequest(ctx, { validationErrors });
    }

    const extendedCtx = ensureBindings(ctx);
    extendedCtx.bindings[config.bindingKey] = result.data;

    await next();
  };
}

/**
 * Validates HTTP request body
 * @param schema - Zod schema for body validation
 * @returns Middleware function
 */
export function withBodyValidation<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, {
    source: ValidationSource.BODY,
    bindingKey: BindingKey.VALIDATED_BODY,
    required: true
  });
}

/**
 * Validates HTTP query parameters
 * @param schema - Zod schema for query validation
 * @returns Middleware function
 */
export function withQueryValidation<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, {
    source: ValidationSource.QUERY,
    bindingKey: BindingKey.VALIDATED_QUERY,
    required: false
  });
}

/**
 * Validates HTTP path parameters
 * @param schema - Zod schema for path validation
 * @returns Middleware function
 */
export function withPathValidation<T>(schema: ZodSchema<T>) {
  return createValidationMiddleware(schema, {
    source: ValidationSource.PATH,
    bindingKey: BindingKey.VALIDATED_PARAMS,
    required: false
  });
}