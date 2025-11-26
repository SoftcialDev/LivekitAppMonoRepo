/**
 * @fileoverview ErrorLogsPage - Page for viewing and managing API error logs
 * @description Displays error logs in a table with filtering and batch deletion capabilities
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/shared/auth/useAuth';
import { useHeader } from '@/app/providers/HeaderContext';
import { useToast } from '@/shared/ui/ToastContext';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import TrashButton from '@/shared/ui/Buttons/TrashButton';
import AddButton from '@/shared/ui/Buttons/AddButton';
import {
  getErrorLogs,
  getErrorLogById,
  resolveErrorLog,
  deleteErrorLogs,
  ErrorLog,
  ErrorLogQueryParams,
} from '@/shared/api/errorLogsClient';
import { ErrorSeverity } from '@/shared/api/types/errorLogs';
import { ErrorSource } from '@/shared/api/types/errorLogs';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';

/**
 * ErrorLogsPage component
 * Displays error logs in a table with checkboxes for batch operations
 */
const ErrorLogsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const { showToast } = useToast();
  const currentEmail = account?.username ?? '';

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ErrorLogQueryParams>({
    limit: 100,
    offset: 0,
  });

  useHeader({
    title: 'Error Logs',
    iconSrc: managementIcon,
    iconAlt: 'Error Logs',
  });

  /**
   * Fetches error logs from the API
   */
  const fetchErrorLogs = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await getErrorLogs(filters);
      setErrorLogs(response.logs);
    } catch (err: any) {
      console.error('Failed to load error logs:', err);
      showToast('Failed to load error logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles deletion of selected error logs
   */
  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one error log to delete', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} error log(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteErrorLogs(selectedIds);
      showToast(`Successfully deleted ${selectedIds.length} error log(s)`, 'success');
      setSelectedIds([]);
      await fetchErrorLogs();
    } catch (err: any) {
      console.error('Failed to delete error logs:', err);
      showToast('Failed to delete error logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles resolving a single error log
   */
  const handleResolve = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await resolveErrorLog(id);
      showToast('Error log marked as resolved', 'success');
      await fetchErrorLogs();
    } catch (err: any) {
      console.error('Failed to resolve error log:', err);
      showToast('Failed to resolve error log', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles viewing details of a single error log
   */
  const handleViewDetails = async (id: string): Promise<void> => {
    try {
      const errorLog = await getErrorLogById(id);
      const details = `
ID: ${errorLog.id}
Severity: ${errorLog.severity}
Source: ${errorLog.source}
Error: ${errorLog.errorName}
Message: ${errorLog.errorMessage}
Endpoint: ${errorLog.endpoint || 'N/A'}
Function: ${errorLog.functionName || 'N/A'}
Status Code: ${errorLog.httpStatusCode || 'N/A'}
Resolved: ${errorLog.resolved ? 'Yes' : 'No'}
Created: ${new Date(errorLog.createdAt).toLocaleString()}
${errorLog.stackTrace ? `\nStack Trace:\n${errorLog.stackTrace}` : ''}
      `.trim();
      alert(details);
    } catch (err: any) {
      console.error('Failed to fetch error log details:', err);
      showToast('Failed to fetch error log details', 'error');
    }
  };

  // Fetch error logs on mount and when filters change
  useEffect(() => {
    if (!initialized || !account) return;
    fetchErrorLogs();
  }, [initialized, account, filters]);

  /**
   * Formats date for display
   */
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  /**
   * Gets severity color class
   */
  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.Critical:
        return 'text-red-500';
      case ErrorSeverity.High:
        return 'text-orange-500';
      case ErrorSeverity.Medium:
        return 'text-yellow-500';
      case ErrorSeverity.Low:
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  /**
   * Table columns definition
   */
  const columns: Column<ErrorLog>[] = [
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => (
        <span className={getSeverityColor(row.severity)}>
          {row.severity}
        </span>
      ),
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
      render: (row) => (
        <span className="truncate max-w-xs" title={row.errorMessage}>
          {row.errorMessage}
        </span>
      ),
    },
    {
      key: 'endpoint',
      header: 'Endpoint',
      render: (row) => row.endpoint || 'N/A',
    },
    {
      key: 'httpStatusCode',
      header: 'Status',
      render: (row) => row.httpStatusCode || 'N/A',
    },
    {
      key: 'resolved',
      header: 'Resolved',
      render: (row) => (
        <span className={row.resolved ? 'text-green-500' : 'text-red-500'}>
          {row.resolved ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetails(row.id)}
            className="px-2 py-1 text-sm bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-light)] transition-colors"
          >
            View
          </button>
          {!row.resolved && (
            <button
              onClick={() => handleResolve(row.id)}
              className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      ),
    },
  ];

  /**
   * Left controls with delete button
   */
  const leftControls = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDeleteSelected}
        className="
          inline-flex items-center space-x-2
          px-4 py-2
          bg-red-600
          text-white font-semibold
          rounded-full
          hover:bg-red-700
          transition-colors
          cursor-pointer
        "
      >
        <span>Delete Selected</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<ErrorLog & { azureAdObjectId?: string }>
        columns={columns}
        data={errorLogs.map(log => ({ ...log, azureAdObjectId: log.id }))}
        pageSize={10}
        addButton={leftControls}
        loading={loading}
        loadingAction="Loading error logs"
        showRowCheckboxes={true}
        getRowKey={(row) => row.id}
        selectedKeys={selectedIds}
        onToggleRow={(key, checked) =>
          setSelectedIds((prev) =>
            checked
              ? Array.from(new Set([...prev, key]))
              : prev.filter((k) => k !== key)
          )
        }
        onToggleAll={(checked, keys) =>
          setSelectedIds(
            checked
              ? Array.from(new Set([...selectedIds, ...keys]))
              : selectedIds.filter((k) => !keys.includes(k))
          )
        }
      />
    </div>
  );
};

export default ErrorLogsPage;

