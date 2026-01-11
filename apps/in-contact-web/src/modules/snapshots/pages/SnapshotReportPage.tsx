/**
 * @fileoverview SnapshotReportPage component
 * @summary Page for viewing and managing snapshot reports
 * @description Displays a table of all snapshot reports with filtering, preview, download, and deletion functionality
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import snapshotIcon from '@/shared/assets/manage_icon_sidebar.png';
import { getSnapshots, deleteSnapshot } from '../api/snapshotsClient';
import { downloadSnapshot } from '../utils/snapshotFileUtils';
import { useHeader } from '@/app/stores/header-store';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { DataTable } from '@/ui-kit/tables';
import { ConfirmModal, PreviewModal } from '@/ui-kit/modals';
import { logError } from '@/shared/utils/logger';
import { createSnapshotReportColumns } from './config/snapshotReportPageConfig';
import type { SnapshotReport } from '../types/snapshotTypes';

/**
 * SnapshotReportPage component
 * 
 * Displays a table of all snapshot reports with:
 * - Preview modal for viewing full-size images
 * - Download functionality with descriptive file names
 * - Delete confirmation modal
 * - Local pagination and search
 */
export const SnapshotReportPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<SnapshotReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState<SnapshotReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SnapshotReport | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Set header
  useHeader({
    title: 'Snapshot Reports',
    iconSrc: snapshotIcon,
    iconAlt: 'Snapshots',
  });

  /** Load all reports */
  const fetchReports = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getSnapshots();
      setReports(data);
    } catch (err) {
      logError(err, { operation: 'fetchReports' });
      showToast('Failed to load snapshot reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!initialized) return;
    fetchReports();
  }, [initialized, fetchReports]);

  /** Open delete-confirmation modal */
  const openDeleteModal = useCallback((r: SnapshotReport): void => {
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
      await deleteSnapshot(deletedId);
      // Remove deleted item from selectedIds if it was selected
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
      showToast('Snapshot deleted', 'success');
      await fetchReports();
      // Force DataTable remount to refresh data
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      logError(err, { operation: 'handleConfirmDelete', snapshotId: deletedId });
      showToast('Failed to delete snapshot', 'error');
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  }, [toDelete, showToast, fetchReports]);

  /** Open preview modal */
  const handleView = useCallback((r: SnapshotReport): void => {
    setPreview(r);
    setPreviewOpen(true);
  }, []);

  /** Handle download with error handling */
  const handleDownload = useCallback(async (report: SnapshotReport): Promise<void> => {
    try {
      await downloadSnapshot(report);
    } catch (err) {
      logError(err, { operation: 'handleDownload', snapshotId: report.id });
      showToast('Download failed', 'error');
    }
  }, [showToast]);

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
      getRowKey: (row: SnapshotReport) => row.id,
    }),
    [selectedIds]
  );

  const columns = useMemo(
    () => createSnapshotReportColumns({
      handleView,
      openDeleteModal,
      handleDownload,
    }),
    [handleView, openDeleteModal, handleDownload]
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-(--color-primary-dark) p-4">
        <div className="flex justify-center max-w-[90%] w-full mx-auto">
          <DataTable<SnapshotReport>
            key={refreshKey}
            columns={columns}
            dataLoader={{
              totalCount: reports.length,
              onFetch: async (limit: number, offset: number) => {
                const paginated = reports.slice(offset, offset + limit);
                return {
                  data: paginated,
                  total: reports.length,
                  count: paginated.length,
                };
              },
              initialFetchSize: 200,
              fetchSize: 200,
            }}
            selection={selection}
            pageSize={10}
            externalLoading={loading || isDeleting}
            externalLoadingAction={isDeleting ? 'Deleting snapshot...' : 'Loading reports'}
            search={{ enabled: true, placeholder: 'Search snapshots...' }}
          />
        </div>
      </div>

      {/* Preview modal: full image fit without cropping */}
      <PreviewModal
        open={previewOpen}
        title="Snapshot Preview"
        onClose={() => setPreviewOpen(false)}
      >
        {preview && (
          <img
            src={preview.imageUrl}
            alt="Full snapshot"
            className="max-w-full w-fit h-auto object-contain rounded"
          />
        )}
      </PreviewModal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this snapshot?"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteOpen(false)}
        confirmLabel="Delete"
      />
    </>
  );
};
