/**
 * @fileoverview Talk Sessions Report page column configuration
 * @summary Column definitions for talk sessions report table
 * @description Defines column configurations for the talk sessions report DataTable
 */

import React from 'react';
import type { Column } from '@/ui-kit/tables';
import {
  getStopReasonLabel,
  calculateDuration,
  formatDuration,
} from '../../utils/talkSessionUtils';
import { formatDateTimeUtc } from '@/shared/utils/dateUtils';
import { TALK_SESSIONS_REPORT_CELL_CLASSES } from '../constants/talkSessionsReportPageConstants';
import type { TalkSessionReport } from '../../types/talkSessionTypes';

/**
 * Creates column definitions for talk sessions report table
 * 
 * @returns Array of column definitions for talk sessions report table
 */
export function createTalkSessionsReportColumns(): Column<TalkSessionReport>[] {
  return [
    {
      key: 'supervisorName',
      header: 'Supervisor',
      render: (row) => (
        <div className={TALK_SESSIONS_REPORT_CELL_CLASSES.NAME_COLUMN}>
          {row.supervisorName}
        </div>
      ),
    },
    {
      key: 'psoName',
      header: 'PSO',
      render: (row) => (
        <div className={TALK_SESSIONS_REPORT_CELL_CLASSES.NAME_COLUMN}>
          {row.psoName}
        </div>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started At',
      render: (row) => formatDateTimeUtc(row.startedAt),
      cellClassName: TALK_SESSIONS_REPORT_CELL_CLASSES.DATE_TIME,
    },
    {
      key: 'stoppedAt',
      header: 'Stopped At',
      render: (row) => formatDateTimeUtc(row.stoppedAt),
      cellClassName: TALK_SESSIONS_REPORT_CELL_CLASSES.DATE_TIME,
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => {
        const duration = calculateDuration(row.startedAt, row.stoppedAt);
        return formatDuration(duration);
      },
      cellClassName: TALK_SESSIONS_REPORT_CELL_CLASSES.DATE_TIME,
    },
    {
      key: 'stopReason',
      header: 'Stop Reason',
      render: (row) => getStopReasonLabel(row.stopReason),
      cellClassName: TALK_SESSIONS_REPORT_CELL_CLASSES.STOP_REASON,
    },
  ];
}

