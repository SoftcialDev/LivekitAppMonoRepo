/**
 * @fileoverview RecordingReportPage component
 * @summary Page for viewing and managing recording reports
 * @description Displays a table of all recording reports with preview, download, and deletion functionality
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import recordingsIcon from '@/shared/assets/manage_icon_sidebar.png';
import { getRecordings, deleteRecording } from '../api/recordingsClient';
import { downloadRecording } from '../utils/recordingFileUtils';
import { useHeader } from '@/app/stores/header-store';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { DataTable } from '@/ui-kit/tables';
import { ConfirmModal, PreviewModal } from '@/ui-kit/modals';
import { logError } from '@/shared/utils/logger';
import { useTableSelection } from '@/shared/hooks/useTableSelection';
import { useLocalDataLoader } from '@/shared/hooks/useLocalDataLoader';
import { createRecordingReportColumns } from './config/recordingReportPageConfig';
import type { RecordingReport } from '../types/recordingTypes';

/**
 * RecordingReportPage component
 * 
 * Displays a table of all recording reports with:
 * - Preview modal for viewing videos
 * - Download functionality with descriptive file names
 * - Delete confirmation modal
 * - Local pagination and search
 */
export const RecordingReportPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<RecordingReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState<RecordingReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<RecordingReport | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Set header
  useHeader({
    title: 'Recordings',
    iconSrc: recordingsIcon,
    iconAlt: 'Recordings',
  });

  /** Load all reports */
  const fetchReports = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getRecordings({
        includeSas: true,
        sasMinutes: 60,
        limit: 200,
        order: 'desc',
      });
      setReports(data);
    } catch (err) {
      logError(err, { operation: 'fetchReports' });
      showToast('Failed to load recording reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!initialized) return;
    fetchReports();
  }, [initialized, fetchReports]);

  /** Open delete-confirmation modal */
  const openDeleteModal = useCallback((r: RecordingReport): void => {
    setToDelete(r);
    setDeleteOpen(true);
  }, []);

  /** Confirm and perform deletion */
  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!toDelete) return;
    const deletedId = toDelete.id;
    setIsDeleting(true);
    setDeleteOpen(false);
    try {
      await deleteRecording(deletedId);
      // Remove deleted item from selectedIds if it was selected
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
      showToast('Recording deleted', 'success');
      await fetchReports();
      // Force DataTable remount to refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      logError(err, { operation: 'deleteRecording', recordingId: deletedId });
      showToast('Failed to delete recording', 'error');
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  }, [toDelete, showToast, fetchReports]);

  /** Open preview modal */
  const handlePreview = useCallback((r: RecordingReport): void => {
    if (!r.playbackUrl && !r.blobUrl) {
      showToast('Recording is not yet available for playback', 'warning');
      return;
    }
    setPreview(r);
    setPreviewOpen(true);
  }, [showToast]);

  /** Handle download with error handling */
  const handleDownload = useCallback(async (recording: RecordingReport): Promise<void> => {
    try {
      await downloadRecording(recording);
    } catch (error) {
      logError(error, { operation: 'downloadRecording', recordingId: recording.id });
      showToast('Download failed', 'error');
    }
  }, [showToast]);

  // Selection config for checkboxes
  const selection = useTableSelection<RecordingReport>({
    selectedKeys: selectedIds,
    setSelectedKeys: setSelectedIds,
    getRowKey: (row: RecordingReport) => row.id,
  });

  // Create columns config
  const columnsConfig = useMemo(
    () => ({
      handlePreview,
      openDeleteModal,
      handleDownload,
    }),
    [handlePreview, openDeleteModal, handleDownload]
  );

  const columns = useMemo(
    () => createRecordingReportColumns(columnsConfig),
    [columnsConfig]
  );

  // Create data loader for local pagination
  const { dataLoader } = useLocalDataLoader({
    data: reports,
    initialFetchSize: 200,
    fetchSize: 200,
  });

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-(--color-primary-dark) p-4">
        <div className="flex justify-center max-w-[90%] w-full mx-auto">
          <DataTable<RecordingReport>
            key={refreshKey}
            columns={columns}
            dataLoader={dataLoader}
            selection={selection}
            pageSize={10}
            externalLoading={loading || isDeleting}
            externalLoadingAction={isDeleting ? 'Deleting recording...' : 'Loading recordings'}
            search={{ enabled: true, placeholder: 'Search recordings...' }}
          />
        </div>
      </div>

      {/* Preview modal: video player */}
      <PreviewModal
        open={previewOpen}
        title="Recording Preview"
        onClose={() => setPreviewOpen(false)}
        maxWidth="w-[90vw] max-w-4xl"
      >
        {preview && (preview.playbackUrl || preview.blobUrl) && (
          <video
            key={preview.id}
            controls
            className="max-w-full max-h-[75vh] rounded"
            src={preview.playbackUrl || preview.blobUrl || undefined}
          >
            <track kind="captions" srcLang="en" label="English" />
          </video>
        )}
      </PreviewModal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this recording?"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteOpen(false)}
        confirmLabel="Delete"
      />
    </>
  );
};

