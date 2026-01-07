/**
 * @fileoverview ValidationTypes - Type definitions for validation operations
 * @summary Defines types and interfaces for validation results
 * @description Encapsulates validation result data structures
 */

import { InvalidFormatError } from '../errors/EntityValidationErrors';

/**
 * Result of a validation operation
 * @description Represents the outcome of validating data against a schema
 */
export interface ValidationResult<T> {
  /**
   * Whether validation was successful
   */
  success: boolean;

  /**
   * Validated data if validation was successful
   */
  data?: T;

  /**
   * Validation errors if validation failed
   */
  errors?: InvalidFormatError[];
}

