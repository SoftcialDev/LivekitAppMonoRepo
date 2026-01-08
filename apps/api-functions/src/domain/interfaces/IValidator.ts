/**
 * @fileoverview IValidator - Domain interface for validation
 * @description Defines contract for validation operations
 */

import { ValidationResult } from '../types/ValidationTypes';
import { ZodSchema } from 'zod';

/**
 * Interface for validation operations
 * @description Defines the contract for validating data against schemas
 */
export interface IValidator {
  /**
   * Validates data against a schema
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Validation result with success flag and data or errors
   */
  validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T>;

  /**
   * Safely validates data without throwing
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Validation result
   */
  safeValidate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T>;
}

