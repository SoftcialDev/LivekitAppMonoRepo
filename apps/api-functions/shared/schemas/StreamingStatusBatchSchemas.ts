/**
 * @fileoverview StreamingStatusBatchSchemas - Validation schemas for batch streaming status operations
 * @summary Provides validation schemas for batch streaming status requests
 * @description Contains validation schemas for batch streaming status operations
 */

/**
 * JSON Schema for validating email array in batch requests
 * Defines constraints for email array validation
 */
export const emailArraySchema = {
  type: 'array',
  items: {
    type: 'string',
    format: 'email',
    minLength: 1,
    maxLength: 255
  },
  minItems: 1,
  maxItems: 1000,
  uniqueItems: true
};

/**
 * JSON Schema for validating batch streaming status request body
 * Defines the complete request structure validation
 */
export const batchRequestSchema = {
  type: 'object',
  required: ['emails'],
  properties: {
    emails: emailArraySchema
  },
  additionalProperties: false
};

/**
 * Validates email array format and constraints
 * Performs comprehensive validation including format, length, uniqueness, and type checks
 * @param emails - Array of email addresses to validate
 * @returns Validation result with success flag and descriptive error message
 * @throws No exceptions thrown, returns validation result object
 * @example
 * const result = validateEmailArray(['user@example.com', 'admin@test.com']);
 * if (!result.isValid) console.error(result.error);
 */
export function validateEmailArray(emails: any): { isValid: boolean; error?: string } {
  if (!Array.isArray(emails)) {
    return { isValid: false, error: 'emails must be an array' };
  }

  if (emails.length === 0) {
    return { isValid: false, error: 'emails array cannot be empty' };
  }

  if (emails.length > 1000) {
    return { isValid: false, error: 'emails array cannot exceed 1000 items' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter(email => 
    typeof email !== 'string' || 
    email.length === 0 || 
    email.length > 255 || 
    !emailRegex.test(email)
  );

  if (invalidEmails.length > 0) {
    return { isValid: false, error: 'emails must be valid email addresses' };
  }

  const uniqueEmails = new Set(emails.map((email: string) => email.toLowerCase()));
  if (uniqueEmails.size !== emails.length) {
    return { isValid: false, error: 'emails must be unique' };
  }

  return { isValid: true };
}
