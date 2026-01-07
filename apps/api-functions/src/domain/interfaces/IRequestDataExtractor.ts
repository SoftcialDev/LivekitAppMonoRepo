/**
 * @fileoverview IRequestDataExtractor - Domain interface for request data extraction
 * @description Defines contract for extracting data from request context
 */

import { Context } from '@azure/functions';

/**
 * Interface for extracting data from request context
 * @description Defines the contract for extracting body, query, and path parameters
 */
export interface IRequestDataExtractor {
  /**
   * Extracts body data from request
   * @param ctx - Azure Functions context
   * @returns Body data or undefined
   * @throws Error if HTTP request context is missing
   */
  extractBody(ctx: Context): unknown;

  /**
   * Extracts query parameters from request
   * @param ctx - Azure Functions context
   * @returns Query parameters object
   * @throws Error if HTTP request context is missing
   */
  extractQuery(ctx: Context): Record<string, unknown>;

  /**
   * Extracts path parameters from request
   * @param ctx - Azure Functions context
   * @returns Path parameters object
   */
  extractPath(ctx: Context): Record<string, unknown>;

  /**
   * Checks if context has HTTP request
   * @param ctx - Azure Functions context
   * @returns True if HTTP request exists
   */
  hasHttpRequest(ctx: Context): boolean;
}

