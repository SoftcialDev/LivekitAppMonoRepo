/**
 * @fileoverview ContextBindings - Type definitions for Azure Functions context bindings
 * @summary Extensions to Azure Functions Context type for custom bindings
 * @description Defines the structure of custom properties attached to ctx.bindings
 */

import type { Context } from '@azure/functions';
import type { JwtPayload } from 'jsonwebtoken';

/**
 * Custom bindings attached to Azure Functions context
 * @description Contains validated request data and authentication information
 */
export interface ContextBindings {
  /**
   * Decoded JWT payload from authentication middleware
   */
  user?: JwtPayload;
  
  /**
   * Access token string from authentication middleware
   */
  accessToken?: string;
  
  /**
   * Caller ID (Azure AD Object ID) extracted from JWT claims
   */
  callerId?: string;
  
  /**
   * Validated request body data
   */
  validatedBody?: unknown;
  
  /**
   * Validated query parameters
   */
  validatedQuery?: unknown;
  
  /**
   * Validated path parameters
   */
  validatedParams?: unknown;
}

/**
 * Extended Azure Functions Context with custom bindings
 * @description Augments the base Context type with our custom binding properties
 */
export interface ExtendedContext extends Context {
  bindings: ContextBindings;
}

/**
 * Type guard to check if context has extended bindings
 * @param ctx - Azure Functions context
 * @returns True if context has extended bindings
 */
export function hasExtendedBindings(ctx: Context): ctx is ExtendedContext {
  return typeof (ctx as ExtendedContext).bindings !== 'undefined';
}

/**
 * Safely gets bindings from context, creating if necessary
 * @param ctx - Azure Functions context
 * @returns Extended context with bindings
 */
export function ensureBindings(ctx: Context): ExtendedContext {
  if (!hasExtendedBindings(ctx)) {
    (ctx as ExtendedContext).bindings = {};
  }
  return ctx as ExtendedContext;
}

