/**
 * @fileoverview IValidator - Domain interface for validation
 * @description Defines contract for validation operations
 */

import { ValidationResult } from '../types/ValidationTypes';

/**
 * Interface for validation operations
 * @description Defines the contract for validating data against schemas
 */
export interface IValidator {
  /**
   * Validates data against a schema
   * @param schema - Schema to validate against (implementation-specific)
   * @param data - Data to validate
   * @returns Validation result with success flag and data or errors
   */
  validate<T>(schema: any, data: unknown): ValidationResult<T>;

  /**
   * Safely validates data without throwing
   * @param schema - Schema to validate against
   * @param data - Data to validate
   * @returns Validation result
   */
  safeValidate<T>(schema: any, data: unknown): ValidationResult<T>;
}

