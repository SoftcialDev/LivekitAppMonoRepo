/**
 * @fileoverview TalkSessionsReportPage component
 * @summary Page for viewing talk session history reports
 * @description Displays a table of all talk sessions with supervisor and PSO information, session start/stop times, and stop reasons
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import snapshotIcon from '@/shared/assets/manage_icon_sidebar.png';
import { getTalkSessions } from '../api/talkSessionsClient';
import { useHeader } from '@/app/stores/header-store';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { DataTable } from '@/ui-kit/tables';
import { logError } from '@/shared/utils/logger';
import { createTalkSessionsReportColumns } from './config/talkSessionsReportPageConfig';
import type { TalkSessionReport } from '../types/talkSessionTypes';

/**
 * TalkSessionsReportPage component
 * 
 * Displays a table of all talk session reports with:
 * - Supervisor and PSO information
 * - Session start and stop times
 * - Duration calculation
 * - Stop reason labels
 * - Local pagination and search
 * - Checkboxes for consistency (no actions available)
 */
export const TalkSessionsReportPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<TalkSessionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Set header
  useHeader({
    title: 'Talk Sessions Report',
    iconSrc: snapshotIcon,
    iconAlt: 'Talk Sessions',
  });

  /** Load all sessions */
  const fetchSessions = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getTalkSessions();
      setSessions(data);
    } catch (err) {
      logError(err, { operation: 'fetchSessions' });
      showToast('Failed to load talk sessions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!initialized) return;
    fetchSessions();
  }, [initialized, fetchSessions]);

  // Selection config for checkboxes
  const selection = useMemo(
    () => ({
      selectedKeys: selectedIds,
      onToggleRow: (key: string, checked: boolean) => {
        setSelectedIds((prev) =>
          checked
            ? Array.from(new Set([...prev, key]))
            : prev.filter((k) => k !== key)
        );
      },
      onToggleAll: (checked: boolean, keys: string[]) => {
        setSelectedIds((prev) =>
          checked
            ? Array.from(new Set([...prev, ...keys]))
            : prev.filter((k) => !keys.includes(k))
        );
      },
      getRowKey: (row: TalkSessionReport) => row.id,
    }),
    [selectedIds]
  );

  const columns = useMemo(() => createTalkSessionsReportColumns(), []);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-(--color-primary-dark) p-4">
      <div className="flex justify-center max-w-[90%] w-full mx-auto">
        <DataTable<TalkSessionReport>
          columns={columns}
          dataLoader={{
            totalCount: sessions.length,
            onFetch: async (limit: number, offset: number) => {
              const paginated = sessions.slice(offset, offset + limit);
              return {
                data: paginated,
                total: sessions.length,
                count: paginated.length,
              };
            },
            initialFetchSize: 200,
            fetchSize: 200,
          }}
          selection={selection}
          pageSize={10}
          externalLoading={loading}
          externalLoadingAction="Loading talk sessions..."
          search={{ enabled: true, placeholder: 'Search talk sessions...' }}
        />
      </div>
    </div>
  );
};

