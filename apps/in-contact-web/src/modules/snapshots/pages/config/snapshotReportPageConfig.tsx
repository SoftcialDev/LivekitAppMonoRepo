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
      cellClassName: 'text-xs',
    },
    { 
      key: 'psoFullName', 
      header: 'PSO',
      cellClassName: 'text-xs',
    },
    {
      key: 'reason',
      header: 'Reason',
      cellClassName: 'whitespace-normal text-xs',
      render: (row) => {
        const reasonText = row.reason?.label || '—';
        return (
          <div 
            className={SNAPSHOT_REPORT_CELL_CLASSES.REASON}
            title={reasonText}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              lineHeight: '1.3',
              fontSize: '0.75rem',
              minWidth: '120px',
              maxWidth: '200px',
              overflow: 'visible'
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
      cellClassName: 'whitespace-normal text-xs',
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
              fontSize: '0.75rem',
              minWidth: '180px',
              maxWidth: '300px',
              overflow: 'visible'
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
          className="w-12 h-12 object-cover rounded cursor-pointer shrink-0"
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
      cellClassName: `${SNAPSHOT_REPORT_CELL_CLASSES.DATE_TIME} text-xs`,
    },
    {
      key: 'actions',
      header: 'Actions',
      cellClassName: 'shrink-0',
      render: row => (
        <div className="flex space-x-1 shrink-0" style={{ width: '90px', justifyContent: 'flex-start' }}>
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

