/**
 * @fileoverview ValidationConfig - Type definitions for validation configuration
 * @summary Defines configuration structure for validation middleware
 * @description Encapsulates validation configuration data structure
 */

import { ValidationSource } from '../enums/ValidationSource';
import { BindingKey } from '../enums/BindingKey';

/**
 * Configuration for validation middleware
 * @description Defines where to extract data from and which binding key to use
 */
export interface ValidationConfig {
  /**
   * Source of the data to validate (body, query, path)
   */
  source: ValidationSource;

  /**
   * Binding key where validated data will be stored
   */
  bindingKey: BindingKey;

  /**
   * Whether the data is required
   */
  required?: boolean;
}

