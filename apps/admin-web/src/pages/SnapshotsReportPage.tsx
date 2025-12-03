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
import TrashButton from '@/shared/ui/Buttons/TrashButton';
import AddModal from '@/shared/ui/ModalComponent';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import { useToast } from '@/shared/ui/ToastContext';
import { SnapshotReport as SnapshotDTO, SNAPSHOT_REASON_LABELS } from '@/shared/types/snapshot';


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

  const [reports, setReports] = useState<SnapshotReport[]>([]);
  const [loading, setLoading] = useState(false);

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

  /** Download via blob+<a download> (requires SAS & CORS) */
/**
 * Downloads a remote image URL directly to the user's machine,
 * without opening a new tab.
 *
 * @param url  The full URL (including SAS token) of the snapshot JPEG.
 */
const handleDownload = async (url: string) => {
  try {
    // 1) Fetch the image as a blob
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();

    // 2) Create an object URL for the blob
    const blobUrl = URL.createObjectURL(blob);

    // 3) Create a temporary <a> with download attribute
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `snapshot-${Date.now()}.jpg`;  // suggest a filename
    document.body.appendChild(a);

    // 4) Trigger the download
    a.click();

    // 5) Clean up
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
        const reasonText = SNAPSHOT_REASON_LABELS[row.reason] || row.reason;
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
          <TrashButton onClick={() => openDeleteModal(row)} />
          <button
            onClick={() => handleDownload(row.imageUrl)}
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

      {/** Preview modal: only “X” header, no footer */}
      <AddModal
        open={previewOpen}
        title="Snapshot Preview"
        onClose={() => setPreviewOpen(false)}
        onConfirm={() => setPreviewOpen(false)}
        hideFooter={true}
        className='w-fit'
      >
        <div className="flex items-center justify-center min-h-[40vh]">
          {preview && (
            <img
              src={preview.imageUrl}
              alt="Full snapshot"
              className="max-w-full max-h-[75vh] rounded"
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
