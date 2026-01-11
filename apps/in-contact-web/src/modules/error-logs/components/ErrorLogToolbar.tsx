/**
 * @fileoverview ErrorLogToolbar - Toolbar with delete actions for error logs
 * @summary Batch deletion buttons for error logs table
 * @description Renders toolbar buttons for deleting selected error logs or all error logs.
 * Used in the left toolbar of the error logs table for batch operations.
 * 
 * Uses CSS utility classes defined in the global stylesheet for consistent theming.
 */

import React from 'react';
import type { IErrorLogToolbarProps } from './types';

/**
 * ErrorLogToolbar component
 * 
 * Renders toolbar buttons for batch deletion operations and migrations:
 * - Delete Selected: Deletes all currently selected error logs (disabled if none selected)
 * - Delete All: Deletes all error logs regardless of selection
 * - Run Migrations: Executes database migrations and seeding
 * 
 * Uses CSS utility classes from the global stylesheet for button styling.
 * 
 * @param props - Component props
 * @returns JSX element with action buttons
 * 
 * @example
 * ```tsx
 * <ErrorLogToolbar
 *   selectedCount={5}
 *   onDeleteSelected={handleDeleteSelected}
 *   onDeleteAll={handleDeleteAll}
 *   onRunMigrations={handleRunMigrations}
 * />
 * ```
 */
export const ErrorLogToolbar: React.FC<IErrorLogToolbarProps> = ({
  selectedCount,
  onDeleteSelected,
  onDeleteAll,
  onRunMigrations,
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onDeleteSelected}
      disabled={selectedCount === 0}
      className="btn-error-delete-selected"
      type="button"
    >
      <span>Delete Selected</span>
    </button>
    <button
      onClick={onDeleteAll}
      className="btn-error-delete-all"
      type="button"
    >
      <span>Delete All</span>
    </button>
    <button
      onClick={onRunMigrations}
      className="btn-error-migrations"
      type="button"
    >
      <span>Run Migrations</span>
    </button>
  </div>
);

