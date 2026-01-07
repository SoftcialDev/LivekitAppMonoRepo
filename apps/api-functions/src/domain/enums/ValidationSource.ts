/**
 * @fileoverview ValidationSource - Enum for validation source types
 * @description Defines the source of data to validate in HTTP requests
 */

/**
 * Source of data to validate in HTTP requests
 */
export enum ValidationSource {
  BODY = 'body',
  QUERY = 'query',
  PATH = 'path'
}

