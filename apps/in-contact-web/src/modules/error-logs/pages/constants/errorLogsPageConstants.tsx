/**
 * @fileoverview Error logs page constants
 * @summary Constants and configuration for ErrorLogsPage component
 * @description Defines table column configurations and other constants for the error logs page
 */

import React from 'react';
import type { Column } from '@/ui-kit/tables';
import type { ErrorLog } from '../../types/errorLogsTypes';
import { SeverityBadge, ResolvedBadge, ErrorLogActions } from '../../components';
import { formatDateForDisplay } from '@/shared/utils/time';

/**
 * Creates table columns configuration for error logs table
 * 
 * This factory function creates the column definitions with the necessary
 * render functions and handlers. The handlers are passed as parameters
 * to allow the columns to be defined outside the component while still
 * having access to component-specific handlers.
 * 
 * @param onViewDetails - Callback for viewing error log details
 * @param onResolve - Callback for resolving an error log
 * @returns Array of column definitions for the error logs table
 * 
 * @example
 * ```typescript
 * const columns = createErrorLogsColumns(handleViewDetails, handleResolve);
 * ```
 */
export function createErrorLogsColumns(
  onViewDetails: (id: string) => void,
  onResolve: (id: string) => void
): Column<ErrorLog>[] {
  return [
    {
      key: 'severity',
      header: 'Severity',
      render: (row: ErrorLog) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'source',
      header: 'Source',
    },
    {
      key: 'errorName',
      header: 'Error',
    },
    {
      key: 'errorMessage',
      header: 'Message',
      cellClassName: 'whitespace-normal',
      render: (row: ErrorLog) => (
        <div 
          className="break-words max-w-md" 
          title={row.errorMessage}
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            minWidth: '200px'
          }}
        >
          {row.errorMessage}
        </div>
      ),
    },
    {
      key: 'userEmail',
      header: 'User Email',
      render: (row: ErrorLog) => row.userEmail || 'N/A',
    },
    {
      key: 'endpoint',
      header: 'Endpoint',
      render: (row: ErrorLog) => row.endpoint || 'N/A',
    },
    {
      key: 'httpStatusCode',
      header: 'Status',
      render: (row: ErrorLog) => row.httpStatusCode?.toString() || 'N/A',
    },
    {
      key: 'resolved',
      header: 'Resolved',
      render: (row: ErrorLog) => <ResolvedBadge resolved={row.resolved} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: ErrorLog) => formatDateForDisplay(row.createdAt),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row: ErrorLog) => (
        <ErrorLogActions
          errorLogId={row.id}
          isResolved={row.resolved}
          onView={onViewDetails}
          onResolve={onResolve}
        />
      ),
    },
  ];
}

