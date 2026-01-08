/**
 * @fileoverview ZodValidator - Infrastructure validator implementation
 * @description Provides Zod-based validation with consistent error handling
 */

import { ZodSchema, ZodError } from 'zod';
import { IValidator } from '../../domain/interfaces/IValidator';
import { ValidationResult } from '../../domain/types/ValidationTypes';
import { InvalidFormatError } from '../../domain/errors'; 

/**
 * Infrastructure implementation of IValidator using Zod
 */
export class ZodValidator implements IValidator {
  /**
   * Validates data against a Zod schema
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Validation result with success flag and data or errors
   */
  validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const validated = schema.parse(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => 
          new InvalidFormatError(
            `${err.path.join('.')}: ${err.message}`
          )
        );
        return { success: false, errors: validationErrors };
      }
      throw error;
    }
  }

  /**
   * Safely validates data without throwing
   * @param schema - Zod schema to validate against
   * @param data - Data to validate
   * @returns Validation result
   */
  safeValidate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    const validationErrors = result.error.errors.map(err =>
      new InvalidFormatError(
        `${err.path.join('.')}: ${err.message}`
      )
    );
    
    return { success: false, errors: validationErrors };
  }
}

