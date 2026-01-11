/**
 * @fileoverview Recording Report page column configuration
 * @summary Column definitions for recording report table
 * @description Defines column configurations for the recording report DataTable
 */

import React from 'react';
import type { Column } from '@/ui-kit/tables';
import { formatDuration } from '../../utils/recordingFileUtils';
import { formatUtcTimestamp } from '@/shared/utils/dateUtils';
import { DownloadButton, TrashButton } from '@/ui-kit/buttons';
import type { RecordingReport } from '../../types/recordingTypes';
import type { IRecordingReportColumnHandlers } from '../types';

/**
 * Creates column definitions for recording report table
 * 
 * @param handlers - Handlers required for column actions (preview, delete, download)
 * @returns Array of column definitions for recording report table
 */
export function createRecordingReportColumns(
  handlers: IRecordingReportColumnHandlers
): Column<RecordingReport>[] {
  const { handlePreview, openDeleteModal, handleDownload } = handlers;

  return [
    {
      key: 'recordedBy',
      header: 'Recorded By',
    },
    {
      key: 'username',
      header: 'Subject',
    },
    {
      key: 'status',
      header: 'Status',
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (row) => formatDuration(row.duration),
    },
    {
      key: 'startedAt',
      header: 'Date & Time',
      render: (row) => formatUtcTimestamp(row.startedAt),
    },
    {
      key: 'playback',
      header: 'Playback',
      render: (row) => (
        <button
          onClick={() => handlePreview(row)}
          className="p-1 hover:text-(--color-secondary) disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!(row.playbackUrl || row.blobUrl)}
          title={row.playbackUrl || row.blobUrl ? 'Preview' : 'Not available'}
        >
          ▶️
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <TrashButton
            onClick={() => openDeleteModal(row)}
            title="Delete recording"
          />
          <DownloadButton
            onClick={() => handleDownload(row)}
            title="Download recording"
            disabled={!(row.playbackUrl || row.blobUrl)}
          />
        </div>
      ),
    },
  ];
}

