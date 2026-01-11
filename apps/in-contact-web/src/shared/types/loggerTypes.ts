/**
 * @fileoverview Logger type definitions
 * @summary Type definitions for logging configuration
 * @description Defines interfaces and types for logger configuration
 */

import type { LogLevel } from '../enums/LogLevel';

/**
 * Logger configuration interface
 * 
 * Defines the configuration options for the logger, including whether
 * logging is enabled and what the minimum log level should be.
 */
export interface ILoggerConfig {
  /** Whether logging is enabled (false disables all logging) */
  enabled: boolean;
  
  /** Minimum log level to output (logs below this level are filtered) */
  level: LogLevel;
}

