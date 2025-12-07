/**
 * @fileoverview SnapshotsReportPage.tsx - Page for viewing and managing snapshot reports
 * @summary Displays a table of all snapshot reports with filtering and deletion
 * @description This page shows all snapshot reports taken by supervisors, including
 * reason labels, descriptions, and provides functionality to view, download, and delete snapshots.
 */

import React, { useEffect, useState } from 'react';
import snapshotIcon from '@/shared/assets/manage_icon_sidebar.png';
import {
  getSnapshots,
  deleteSnapshot
} from '@/shared/api/snapshotsClient';
import { useHeader } from '@/app/providers/HeaderContext';
import { useAuth } from '@/shared/auth/useAuth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { Permission } from '@/shared/auth/permissions';
import TrashButton from '@/shared/ui/Buttons/TrashButton';
import AddModal from '@/shared/ui/ModalComponent';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import { useToast } from '@/shared/ui/ToastContext';
import { SnapshotReport as SnapshotDTO } from '@/shared/types/snapshot';


//////////////////////
// Page’s Row Type  //
//////////////////////

/**
 * One snapshot report row, extended locally with an
 * optional `azureAdObjectId` for TableComponent’s filtering.
 *
 * @remarks
 * - Re‑uses the exact shape returned by `getSnapshots()`.
 * - Adds `azureAdObjectId?` so TableComponent can do search.
 */
export type SnapshotReport = SnapshotDTO & {
  azureAdObjectId?: string
};

//////////////////////
// Component        //
//////////////////////

const SnapshotsReportPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast }   = useToast();
  const { hasPermission } = usePermissions();

  const [reports, setReports] = useState<SnapshotReport[]>([]);
  const [loading, setLoading] = useState(false);

  const canDeleteSnapshot = hasPermission(Permission.SnapshotsDelete);

/**
 * Formats a timestamp string without applying a local timezone offset.
 * Falls back to the original value if parsing fails.
 *
 * @param isoString - ISO-8601 timestamp returned by the API.
 */
const formatTakenAtUtc = (isoString: string | undefined) => {
  if (!isoString) return '—';
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return isoString;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dt);
};

  // Preview modal
  const [preview, setPreview]         = useState<SnapshotReport | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Delete confirm modal
  const [toDelete, setToDelete]     = useState<SnapshotReport | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useHeader({
    title:   'Snapshot Reports',
    iconSrc: snapshotIcon,
    iconAlt: 'Snapshots',
  });

  /** Load all reports */
  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getSnapshots();
      setReports(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load snapshot reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchReports();
  }, [initialized]);

  /** Open delete‐confirmation modal */
  const openDeleteModal = (r: SnapshotReport) => {
    setToDelete(r);
    setDeleteOpen(true);
  };

  /** Confirm and perform deletion */
  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteSnapshot(toDelete.id);
      showToast('Snapshot deleted', 'success');
      fetchReports();
    } catch {
      showToast('Failed to delete snapshot', 'error');
    } finally {
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  /** Open preview modal */
  const handleView = (r: SnapshotReport) => {
    setPreview(r);
    setPreviewOpen(true);
  };

  /**
   * Generates a descriptive file name for snapshot download
   * @description Creates a human-readable file name with format: {psoName}_{reasonCode}_{date}_{time}_{shortId}.jpg
   * @param report - Snapshot report containing PSO name, reason, and takenAt date
   * @returns Formatted file name
   */
  const generateDownloadFileName = (report: SnapshotReport): string => {
    // Sanitize PSO name (max 20 chars, replace spaces with underscores, remove special chars)
    const sanitize = (str: string, maxLen: number = 50): string => {
      if (!str) return 'unknown';
      let sanitized = str.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      sanitized = sanitized.replace(/_+/g, '_').replace(/^[._-]+|[._-]+$/g, '');
      if (sanitized.length > maxLen) {
        sanitized = sanitized.substring(0, maxLen).replace(/_+$/, '');
      }
      return sanitized || 'unknown';
    };

    const psoName = sanitize(report.psoFullName || report.psoEmail?.split('@')[0] || 'unknown', 20);
    const reasonCode = sanitize(report.reason?.code || 'UNKNOWN', 15).toUpperCase();
    
    // Format date and time from takenAt
    const takenAt = report.takenAt ? new Date(report.takenAt) : new Date();
    const dateStr = takenAt.toISOString().slice(0, 10).replace(/-/g, '');
    const hours = String(takenAt.getHours()).padStart(2, '0');
    const minutes = String(takenAt.getMinutes()).padStart(2, '0');
    const seconds = String(takenAt.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}${minutes}${seconds}`;
    
    // Get last 6 characters of snapshot ID for uniqueness
    const shortId = report.id.slice(-6);
    
    return `snapshot_${psoName}_${reasonCode}_${dateStr}_${timeStr}_${shortId}.jpg`;
  };

  /**
   * Downloads a remote image URL directly to the user's machine
   * @description Fetches the image from blob storage and triggers a download with a descriptive file name
   * @param report - Snapshot report containing image URL and metadata
   */
  const handleDownload = async (report: SnapshotReport) => {
    try {
      // 1) Fetch the image as a blob
      const res = await fetch(report.imageUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      // 2) Create an object URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // 3) Generate descriptive file name
      const fileName = generateDownloadFileName(report);

      // 4) Create a temporary <a> with download attribute
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);

      // 5) Trigger the download
      a.click();

      // 6) Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
      showToast('Download failed', 'error');
    }
  };


  const columns: Column<SnapshotReport>[] = [
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
      cellClassName: 'whitespace-normal',
      render: (row) => {
        const reasonText = row.reason?.label || '—';
        return (
          <div 
            className="break-words max-w-md" 
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
      cellClassName: 'whitespace-normal',
      render: (row) => {
        const description = row.description || '—';
        return (
          <div 
            className="break-words max-w-md" 
            title={description}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.4',
              minWidth: '200px'
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
        <img
          src={row.imageUrl}
          alt="thumb"
          className="w-16 h-16 object-cover rounded cursor-pointer"
          onClick={() => handleView(row)}
        />
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'takenAt',       
      header: 'Date & Time',
      render: row => {
      return formatTakenAtUtc(row.takenAt);
      },
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: row => (
        <div className="flex space-x-2">
          {canDeleteSnapshot && (
            <TrashButton onClick={() => openDeleteModal(row)} />
          )}
          <button
            onClick={() => handleDownload(row)}
            className="p-1 hover:text-[var(--color-secondary)]"
          >
            📥
          </button>
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
  ];

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
        <TableComponent<SnapshotReport>
          columns={columns}
          data={reports}
          pageSize={10}
          loading={loading}
          loadingAction="Loading reports"
          addButton={null}
        />
      </div>

      {/** Preview modal: full image fit without cropping */}
      <AddModal
        open={previewOpen}
        title="Snapshot Preview"
        onClose={() => setPreviewOpen(false)}
        onConfirm={() => setPreviewOpen(false)}
        hideFooter={true}
        className="w-[90vw] max-w-6xl"
      >
        <div className="flex items-center justify-center min-h-[40vh] max-h-[85vh] overflow-auto p-2">
          {preview && (
            <img
              src={preview.imageUrl}
              alt="Full snapshot"
              className="max-w-full w-fit h-auto object-contain rounded"
            />
          )}
        </div>
      </AddModal>

      {/** Delete confirmation modal */}
      <AddModal
        open={deleteOpen}
        title="Confirm Delete"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        className='w-fit'
      >
        <p className="text-white">
          Are you sure you want to delete this snapshot?
        </p>
      </AddModal>
    </>
  );
};

export default SnapshotsReportPage;
