/**
 * @fileoverview ErrorLogActions - Action buttons for error log table rows
 * @summary View and Resolve action buttons for individual error logs
 * @description Renders action buttons (View and Resolve) for error log table rows.
 * The Resolve button is only shown if the error log is not already resolved.
 * 
 * Uses CSS utility classes defined in the global stylesheet for consistent theming.
 */

import React from 'react';
import type { IErrorLogActionsProps } from './types';

/**
 * ErrorLogActions component
 * 
 * Renders action buttons for error log table rows:
 * - View button: Always visible, opens details modal
 * - Resolve button: Only visible if error log is not resolved
 * 
 * Uses CSS utility classes from the global stylesheet for button styling.
 * 
 * @param props - Component props
 * @returns JSX element with action buttons
 * 
 * @example
 * ```tsx
 * <ErrorLogActions
 *   errorLogId="123"
 *   isResolved={false}
 *   onView={(id) => handleViewDetails(id)}
 *   onResolve={(id) => handleResolve(id)}
 * />
 * ```
 */
export const ErrorLogActions: React.FC<IErrorLogActionsProps> = ({
  errorLogId,
  isResolved,
  onView,
  onResolve,
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onView(errorLogId)}
      className="btn-error-view"
      type="button"
    >
      View
    </button>
    {!isResolved && (
      <button
        onClick={() => onResolve(errorLogId)}
        className="btn-error-resolve"
        type="button"
      >
        Resolve
      </button>
    )}
  </div>
);

