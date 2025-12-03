/**
 * @fileoverview TalkSessionsReportPage.tsx - Page for viewing talk session history reports
 * @summary Displays a paginated table of all talk sessions with supervisor and PSO information
 * @description This page shows all talk session history records, including supervisor and PSO details,
 * session start/stop times, and stop reasons. Only accessible to Admin and SuperAdmin roles.
 */

import React, { useEffect, useState } from 'react';
import snapshotIcon from '@/shared/assets/manage_icon_sidebar.png';
import { TalkSessionClient, TalkSessionReport as TalkSessionReportDTO } from '@/shared/api/talkSessionClient';
import { useHeader } from '@/app/providers/HeaderContext';
import { useAuth } from '@/shared/auth/useAuth';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import { useToast } from '@/shared/ui/ToastContext';
import { TalkStopReason } from '@/shared/types/talkSession';

/**
 * Talk session report row type, extended with optional azureAdObjectId for TableComponent filtering.
 */
type TalkSessionReport = TalkSessionReportDTO & {
  azureAdObjectId?: string;
};

/**
 * Provides a human-readable label for each TalkStopReason.
 * @param reason - The TalkStopReason enum value or string.
 * @returns A string label for the reason.
 */
function getStopReasonLabel(reason: string | null): string {
  if (!reason) return '—';
  
  switch (reason) {
    case TalkStopReason.USER_STOP:
      return 'User Stop';
    case TalkStopReason.PSO_DISCONNECTED:
      return 'PSO Disconnected';
    case TalkStopReason.SUPERVISOR_DISCONNECTED:
      return 'Supervisor Disconnected';
    case TalkStopReason.BROWSER_REFRESH:
      return 'Browser Refresh';
    case TalkStopReason.CONNECTION_ERROR:
      return 'Connection Error';
    case TalkStopReason.UNKNOWN:
      return 'Unknown';
    default:
      return reason;
  }
}

/**
 * Formats a timestamp string to a readable date/time format.
 * @param isoString - ISO-8601 timestamp string.
 * @returns Formatted date/time string.
 */
function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return isoString;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt);
}

/**
 * Calculates the duration of a talk session in seconds.
 * @param startedAt - ISO timestamp when session started.
 * @param stoppedAt - ISO timestamp when session stopped, or null if still active.
 * @returns Duration in seconds, or null if session is still active.
 */
function calculateDuration(startedAt: string, stoppedAt: string | null): number | null {
  if (!stoppedAt) return null;
  const start = new Date(startedAt).getTime();
  const stop = new Date(stoppedAt).getTime();
  return Math.floor((stop - start) / 1000);
}

/**
 * Formats duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds.
 * @returns Formatted duration string (e.g., "5m 30s" or "1h 5m").
 */
function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Active';
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

const TalkSessionsReportPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();
  const talkSessionClient = new TalkSessionClient();

  const [sessions, setSessions] = useState<TalkSessionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useHeader({
    title: 'Talk Sessions Report',
    iconSrc: snapshotIcon,
    iconAlt: 'Talk Sessions',
  });

  /**
   * Loads talk sessions for the current page.
   */
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await talkSessionClient.getTalkSessions(page, limit);
      setSessions(response.sessions);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load talk sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchSessions();
  }, [initialized, page]);

  const columns: Column<TalkSessionReport>[] = [
    {
      key: 'supervisorName',
      header: 'Supervisor',
      render: row => (
        <div>
          <div className="font-semibold">{row.supervisorName}</div>
          <div className="text-sm text-gray-400">{row.supervisorEmail}</div>
        </div>
      )
    },
    {
      key: 'psoName',
      header: 'PSO',
      render: row => (
        <div>
          <div className="font-semibold">{row.psoName}</div>
          <div className="text-sm text-gray-400">{row.psoEmail}</div>
        </div>
      )
    },
    {
      key: 'startedAt',
      header: 'Started At',
      render: row => formatDateTime(row.startedAt)
    },
    {
      key: 'stoppedAt',
      header: 'Stopped At',
      render: row => formatDateTime(row.stoppedAt)
    },
    {
      key: 'duration',
      header: 'Duration',
      render: row => {
        const duration = calculateDuration(row.startedAt, row.stoppedAt);
        return formatDuration(duration);
      }
    },
    {
      key: 'stopReason',
      header: 'Stop Reason',
      render: row => getStopReasonLabel(row.stopReason)
    }
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<TalkSessionReport>
        columns={columns}
        data={sessions}
        pageSize={limit}
        loading={loading}
        loadingAction="Loading talk sessions..."
        addButton={null}
      />
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-white">
          <div>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} sessions
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalkSessionsReportPage;

