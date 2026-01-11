/**
 * @fileoverview Error logs module - Public exports
 * @description Barrel export for error logs module
 */

export { errorLogsRoutes } from './routes';
export { ErrorLogsPage } from './pages/ErrorLogsPage';

// Re-export enums
export { ErrorSeverity, ErrorSource } from './enums/errorLogsEnums';

// Re-export types and interfaces
export type {
  ErrorLog,
  ErrorLogQueryParams,
  GetErrorLogsResponse,
  DeleteErrorLogsRequest,
  DeleteErrorLogsResponse,
  RunMigrationsResponse,
  IApiErrorResponse,
} from './types/errorLogsTypes';

// Re-export error classes
export {
  ErrorLogsError,
  ErrorLogsFetchError,
  ErrorLogByIdFetchError,
  ErrorLogResolveError,
  ErrorLogsDeleteError,
  ErrorLogsDeleteAllError,
  MigrationsRunError,
} from './errors';

// Re-export API functions
export {
  getErrorLogs,
  getErrorLogById,
  resolveErrorLog,
  deleteErrorLogs,
  deleteAllErrorLogs,
} from './api/errorLogsClient';
export { runMigrations } from './api/migrationsClient';

// Re-export components
export {
  ErrorLogDetailsModal,
  SeverityBadge,
  ResolvedBadge,
  ErrorLogActions,
  ErrorLogToolbar,
} from './components';

// Re-export component types
export type { IErrorLogDetailsModalProps } from './types/errorLogsTypes';
export type {
  ISeverityBadgeProps,
  IResolvedBadgeProps,
  IErrorLogActionsProps,
  IErrorLogToolbarProps,
} from './components';

// Re-export utilities
export {
  formatErrorLogForClipboard,
  copyErrorLogToClipboard,
} from './utils';
