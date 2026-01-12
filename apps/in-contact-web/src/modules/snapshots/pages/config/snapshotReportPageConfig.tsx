/**
 * @fileoverview Snapshot Report page column configuration
 * @summary Column definitions for snapshot report table
 * @description Defines column configurations for the snapshot report DataTable
 */

import React from 'react';
import type { Column } from '@/ui-kit/tables';
import { formatUtcTimestamp } from '@/shared/utils/dateUtils';
import { DownloadButton, TrashButton } from '@/ui-kit/buttons';
import { SNAPSHOT_REPORT_CELL_CLASSES } from '../constants/snapshotReportPageConstants';
import type { SnapshotReport } from '../../types/snapshotTypes';
import type { ISnapshotReportColumnHandlers } from '../types/snapshotReportPageTypes';

/**
 * Creates column definitions for snapshot report table
 * 
 * @param handlers - Handlers required for column actions (preview, delete, download)
 * @returns Array of column definitions for snapshot report table
 */
export function createSnapshotReportColumns(
  handlers: ISnapshotReportColumnHandlers
): Column<SnapshotReport>[] {
  const { handleView, openDeleteModal, handleDownload } = handlers;

  return [
    { 
      key: 'supervisorName', 
      header: 'Taken By',
    },
    { 
      key: 'psoFullName', 
      header: 'PSO',
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => {
        const reasonText = row.reason?.label || '—';
        return (
          <div 
            className={SNAPSHOT_REPORT_CELL_CLASSES.REASON}
            title={reasonText}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.4',
              minWidth: '150px'
            }}
          >
            {reasonText}
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => {
        const description = row.description || '—';
        return (
          <div 
            className={SNAPSHOT_REPORT_CELL_CLASSES.DESCRIPTION}
            title={description}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              lineHeight: '1.4',
              minWidth: '200px',
              maxWidth: '400px',
              overflowY: 'auto',
              maxHeight: '120px'
            }}
          >
            {description}
          </div>
        );
      },
    },
    {
      key: 'imageUrl',
      header: 'Snapshot',
      render: row => (
        <button
          type="button"
          onClick={() => handleView(row)}
          className={SNAPSHOT_REPORT_CELL_CLASSES.IMAGE}
          aria-label={`View snapshot for ${row.psoFullName}`}
        >
          <img
            src={row.imageUrl}
            alt="thumb"
            className="w-full h-full object-contain"
          />
        </button>
      ),
    },
    {
      key: 'takenAt',       
      header: 'Date & Time',
      render: row => formatUtcTimestamp(row.takenAt),
      cellClassName: SNAPSHOT_REPORT_CELL_CLASSES.DATE_TIME,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className="flex space-x-2">
          <TrashButton
            onClick={() => openDeleteModal(row)}
            title="Delete snapshot"
          />
          <DownloadButton
            onClick={() => handleDownload(row)}
            title="Download snapshot"
          />
        </div>
      ),
    },
  ];
}

