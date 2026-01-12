/**
 * @fileoverview ErrorLogsPage - Page for viewing and managing API error logs
 * @description Displays error logs in a table with incremental loading, filtering, and batch deletion capabilities
 */

import React, { useState, useCallback } from 'react';
import { DataTable, type Column } from '@/ui-kit/tables';
import { Loading, useToast } from '@/ui-kit/feedback';
import {
  getErrorLogs,
  getErrorLogById,
  resolveErrorLog,
  deleteErrorLogs,
  deleteAllErrorLogs,
} from '../api/errorLogsClient';
import { runMigrations } from '../api/migrationsClient';
import type { ErrorLog } from '../types/errorLogsTypes';
import {
  ErrorLogsFetchError,
  ErrorLogByIdFetchError,
  ErrorLogResolveError,
  ErrorLogsDeleteError,
  ErrorLogsDeleteAllError,
  MigrationsRunError,
} from '../errors';
import {
  ErrorLogDetailsModal,
  ErrorLogToolbar,
} from '../components';
import { createErrorLogsColumns } from './constants';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { ConfirmModal } from '@/ui-kit/modals';
import { useTableSelection } from '@/shared/hooks/useTableSelection';
import { useHeader } from '@/app/stores';

/**
 * ErrorLogsPage component
 * Displays error logs in a table with incremental loading, checkboxes for batch operations
 */
export const ErrorLogsPage: React.FC = () => {
  const { showToast } = useToast();

  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedErrorLog, setSelectedErrorLog] = useState<ErrorLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMigrationsModalOpen, setIsMigrationsModalOpen] = useState<boolean>(false);
  const [isRunningMigrations, setIsRunningMigrations] = useState<boolean>(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);

  useHeader({
    title: 'Error Logs',
    iconSrc: managementIcon,
    iconAlt: 'Error Logs',
  });

  /**
   * Refreshes all data by forcing DataTable to remount
   * This triggers DataTable to reload from the beginning
   */
  const refreshData = useCallback((): void => {
    // Force remount by changing key, which resets all internal state
    setRefreshKey(prev => prev + 1);
    // Reset total count - it will be updated when fetch completes
    setTotalCount(0);
  }, []);

  /**
   * Fetches error logs from the API for incremental loading
   * 
   * @param limit - Number of records to fetch
   * @param offset - Starting offset for the fetch
   * @returns Promise with fetched data and total count
   */
  const fetchErrorLogs = useCallback(async (
    limit: number,
    offset: number
  ): Promise<{ data: ErrorLog[]; total: number; count: number }> => {
    try {
      const response = await getErrorLogs({ limit, offset });
      setTotalCount(response.total || response.count);
      return {
        data: response.logs,
        total: response.total || response.count,
        count: response.count,
      };
    } catch (error) {
      if (error instanceof ErrorLogsFetchError) {
        showToast(error.message, 'error');
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load error logs', 'error');
      }
      throw error;
    }
  }, [showToast]);

  /**
   * Handles deletion of selected error logs
   */
  const handleDeleteSelected = useCallback(async (): Promise<void> => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one error log to delete', 'warning');
      return;
    }

    if (!globalThis.confirm(`Are you sure you want to delete ${selectedIds.length} error log(s)?`)) {
      return;
    }

    try {
      await deleteErrorLogs(selectedIds);
      showToast(`Successfully deleted ${selectedIds.length} error log(s)`, 'success');
      setSelectedIds([]);
      // Refresh data to get updated total count and reload table
      refreshData();
    } catch (error) {
      if (error instanceof ErrorLogsDeleteError) {
        showToast(error.message, 'error');
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to delete error logs', 'error');
      }
    }
  }, [selectedIds, showToast, refreshData]);

  /**
   * Handles opening the delete all confirmation modal
   */
  const handleDeleteAll = useCallback((): void => {
    setIsDeleteAllModalOpen(true);
  }, []);

  /**
   * Confirms and executes deletion of all error logs
   */
  const confirmDeleteAll = useCallback(async (): Promise<void> => {
    setIsDeleteAllModalOpen(false);
    setIsDeletingAll(true);

    try {
      await deleteAllErrorLogs();
      showToast('Successfully deleted all error logs', 'success');
      setSelectedIds([]);
      // Clear all data and refresh
      refreshData();
    } catch (error) {
      if (error instanceof ErrorLogsDeleteAllError) {
        showToast(error.message, 'error');
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to delete all error logs', 'error');
      }
    } finally {
      setIsDeletingAll(false);
    }
  }, [showToast, refreshData]);

  /**
   * Handles resolving a single error log
   */
  const handleResolve = useCallback(async (id: string): Promise<void> => {
    try {
      await resolveErrorLog(id);
      showToast('Error log marked as resolved', 'success');
      // Refresh data to reflect the resolved status
      refreshData();
    } catch (error) {
      if (error instanceof ErrorLogResolveError) {
        showToast(error.message, 'error');
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to resolve error log', 'error');
      }
    }
  }, [showToast]);

  /**
   * Handles viewing details of a single error log
   */
  const handleViewDetails = useCallback(async (id: string): Promise<void> => {
    try {
      const errorLog = await getErrorLogById(id);
      setSelectedErrorLog(errorLog);
      setIsDetailsModalOpen(true);
    } catch (error) {
      if (error instanceof ErrorLogByIdFetchError) {
        showToast(error.message, 'error');
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to fetch error log details', 'error');
      }
    }
  }, [showToast]);

  /**
   * Handles running database migrations
   * 
   * Opens a confirmation modal before executing migrations.
   * After confirmation, runs migrations and shows success/error toast.
   */
  const handleRunMigrations = useCallback((): void => {
    setIsMigrationsModalOpen(true);
  }, []);

  /**
   * Confirms and executes database migrations
   */
  const confirmRunMigrations = useCallback(async (): Promise<void> => {
    setIsMigrationsModalOpen(false);
    setIsRunningMigrations(true);

    try {
      const result = await runMigrations();
      if (result.success) {
        showToast(result.message || 'Migrations completed successfully', 'success');
      } else {
        const errorMessage = result.message || result.error || 'Migrations failed';
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      if (error instanceof MigrationsRunError) {
        showToast(error.message, 'error');
      } else if (error instanceof Error) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to run migrations', 'error');
      }
    } finally {
      setIsRunningMigrations(false);
    }
  }, [showToast]);

  /**
   * Table columns definition
   * 
   * Uses factory function from constants to create columns with handlers
   */
  const columns: Column<ErrorLog>[] = React.useMemo(
    () => createErrorLogsColumns(handleViewDetails, handleResolve),
    [handleViewDetails, handleResolve]
  );

  /**
   * Left toolbar actions with delete buttons and migrations
   */
  const leftToolbarActions = React.useMemo(
    () => (
      <ErrorLogToolbar
        selectedCount={selectedIds.length}
        onDeleteSelected={handleDeleteSelected}
        onDeleteAll={handleDeleteAll}
        onRunMigrations={handleRunMigrations}
      />
    ),
    [selectedIds.length, handleDeleteSelected, handleDeleteAll, handleRunMigrations]
  );

  // Selection config for checkboxes
  const selection = useTableSelection<ErrorLog>({
    selectedKeys: selectedIds,
    setSelectedKeys: setSelectedIds,
    getRowKey: (row: ErrorLog) => row.id,
  });

  return (
    <div className="relative flex flex-col flex-1 min-h-0 bg-(--color-primary-dark) p-4">
      {/* Show loading overlay during migrations */}
      {isRunningMigrations && (
        <div className="absolute inset-0 bg-(--color-primary-dark) bg-opacity-75 flex items-center justify-center z-50">
          <Loading action="Running migrations..." />
        </div>
      )}

      <div className="flex justify-center max-w-[90%] w-full mx-auto">
        <DataTable<ErrorLog>
        key={refreshKey}
        columns={columns}
        dataLoader={{
          initialFetchSize: 80,
          fetchSize: 80,
          onFetch: fetchErrorLogs,
          totalCount: totalCount || 0,
        }}
        selection={selection}
        search={{ enabled: true, placeholder: 'Search error logs...' }}
        pageSize={8}
        leftToolbarActions={leftToolbarActions}
      />
      </div>

      <ErrorLogDetailsModal
        errorLog={selectedErrorLog}
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedErrorLog(null);
        }}
      />

      <ConfirmModal
        open={isMigrationsModalOpen}
        title="Run Database Migrations"
        message="Are you sure you want to run database migrations? This will update the database schema and seed permissions."
        onClose={() => setIsMigrationsModalOpen(false)}
        onConfirm={confirmRunMigrations}
        confirmLabel="Run Migrations"
        cancelLabel="Cancel"
        confirmDisabled={isRunningMigrations}
      />

      <ConfirmModal
        open={isDeleteAllModalOpen}
        title="Delete All Error Logs"
        message="Are you sure you want to delete ALL error logs? This action cannot be undone."
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={confirmDeleteAll}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        confirmDisabled={isDeletingAll}
      />
    </div>
  );
};

