/**
 * @fileoverview CommonSchemas - Shared validation schemas for common fields
 * @summary Reusable Zod schemas for frequently used request fields
 * @description Contains common validation schemas that are reused across multiple endpoints
 * to maintain consistency and reduce code duplication.
 */

import { z } from 'zod';

/**
 * Common email validation schema.
 * Validates email format and normalizes to lowercase.
 * 
 * @example
 * const schema = z.object({
 *   email: emailSchema,
 *   otherField: z.string()
 * });
 */
export const emailSchema = z.string().email("Invalid email format");

/**
 * Common user ID validation schema.
 * Validates UUID format for user identifiers.
 * 
 * @example
 * const schema = z.object({
 *   userId: userIdSchema,
 *   action: z.string()
 * });
 */
export const userIdSchema = z.string().uuid("Invalid user ID format");

/**
 * Common pagination schema for list endpoints.
 * Provides consistent pagination parameters across the application.
 * 
 * @example
 * const schema = z.object({
 *   page: paginationSchema.shape.page,
 *   limit: paginationSchema.shape.limit
 * });
 */
export const paginationSchema = z.object({
  /**
   * Page number (1-based)
   * @type {number}
   */
  page: z.number().int().min(1).default(1),
  
  /**
   * Number of items per page
   * @type {number}
   */
  limit: z.number().int().min(1).max(100).default(10)
});

/**
 * Common search schema for filtering endpoints.
 * Provides consistent search and filtering parameters.
 * 
 * @example
 * const schema = z.object({
 *   search: searchSchema.shape.query,
 *   role: z.enum(['Admin', 'Employee'])
 * });
 */
export const searchSchema = z.object({
  /**
   * Search query string
   * @type {string}
   */
  query: z.string().min(1).max(100).optional(),
  
  /**
   * Filter by user role
   * @type {string}
   */
  role: z.string().optional()
});
