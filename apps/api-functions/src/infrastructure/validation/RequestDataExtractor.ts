/**
 * @fileoverview RequestDataExtractor - Infrastructure implementation for request data extraction
 * @description Extracts data from Azure Functions context, implements IRequestDataExtractor
 */

import { Context, HttpRequest } from '@azure/functions';
import { IRequestDataExtractor } from '../../domain/interfaces/IRequestDataExtractor';
import { ConfigurationError } from '../../domain/errors/InfrastructureErrors';

/**
 * Infrastructure implementation of IRequestDataExtractor for Azure Functions
 */
export class RequestDataExtractor implements IRequestDataExtractor {
  /**
   * Extracts body data from request
   * @param ctx - Azure Functions context
   * @returns Body data or undefined
   * @throws Error if HTTP request context is missing
   */
  extractBody(ctx: Context): unknown {
    if (!ctx.req) {
      throw new ConfigurationError('No HTTP request context');
    }
    return ctx.req.body;
  }

  /**
   * Extracts query parameters from request
   * @param ctx - Azure Functions context
   * @returns Query parameters object
   * @throws Error if HTTP request context is missing
   */
  extractQuery(ctx: Context): Record<string, unknown> {
    if (!ctx.req) {
      throw new ConfigurationError('No HTTP request context');
    }
    return ctx.req.query || {};
  }

  /**
   * Extracts path parameters from request
   * @param ctx - Azure Functions context
   * @returns Path parameters object
   */
  extractPath(ctx: Context): Record<string, unknown> {
    const bindingData = ctx.bindingData || {};
    const reqParams = (ctx.req as HttpRequest)?.params || {};
    
    return Object.keys(bindingData).length > 0 ? bindingData : reqParams;
  }

  /**
   * Checks if context has HTTP request
   * @param ctx - Azure Functions context
   * @returns True if HTTP request exists
   */
  hasHttpRequest(ctx: Context): boolean {
    return !!ctx.req;
  }
}

