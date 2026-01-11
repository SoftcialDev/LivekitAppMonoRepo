/**
 * @fileoverview Error log component type definitions
 * @summary Type definitions for error log-related components
 * @description Defines interfaces for error log UI components
 */

import { ErrorSeverity } from '../../enums/errorLogsEnums';

/**
 * Props for SeverityBadge component
 */
export interface ISeverityBadgeProps {
  /**
   * Error severity level to display
   */
  severity: ErrorSeverity;
}

/**
 * Props for ResolvedBadge component
 */
export interface IResolvedBadgeProps {
  /**
   * Whether the error log is resolved
   */
  resolved: boolean;
}

/**
 * Props for ErrorLogActions component
 */
export interface IErrorLogActionsProps {
  /**
   * Error log ID
   */
  errorLogId: string;

  /**
   * Whether the error log is already resolved
   */
  isResolved: boolean;

  /**
   * Callback fired when View button is clicked
   * 
   * @param id - Error log ID
   */
  onView: (id: string) => void;

  /**
   * Callback fired when Resolve button is clicked
   * 
   * @param id - Error log ID
   */
  onResolve: (id: string) => void;
}

/**
 * Props for ErrorLogToolbar component
 */
export interface IErrorLogToolbarProps {
  /**
   * Number of selected error logs
   */
  selectedCount: number;

  /**
   * Callback fired when Delete Selected button is clicked
   */
  onDeleteSelected: () => void;

  /**
   * Callback fired when Delete All button is clicked
   */
  onDeleteAll: () => void;

  /**
   * Callback fired when Run Migrations button is clicked
   */
  onRunMigrations: () => void;
}

