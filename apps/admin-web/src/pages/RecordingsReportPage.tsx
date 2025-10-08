/**
 * @file Recordings report page.
 *
 * Renders a paginated table of LiveKit recordings:
 * - Columns: Recorded By, Subject, Status, Duration, Date & Time, Playback, Actions.
 * - Data source: GET /api/recordings via `getRecordings()`.
 * - Delete action: DELETE /api/recordings/{id} via `deleteRecording()`.
 * - Playback preview uses short-lived SAS URL when available.
 */

import React, { useEffect, useState } from "react";
import recordingsIcon from "@/shared/assets/manage_icon_sidebar.png";
import { useHeader } from "@/app/providers/HeaderContext";
import { useAuth } from "@/shared/auth/useAuth";
import { useToast } from "@/shared/ui/ToastContext";
import TrashButton from "@/shared/ui/Buttons/TrashButton";
import AddModal from "@/shared/ui/ModalComponent";
import { Column, TableComponent } from "@/shared/ui/TableComponent";

import {
  getRecordings,
  deleteRecording,
  type RecordingListItem,
  type ListRecordingsResponse,
} from "@/shared/api/recordingCommandClient";

/**
 * Table row type for the recordings table.
 * Adds `azureAdObjectId?` to align with the generic TableComponent typing.
 */
export type RecordingRow = RecordingListItem & {
  azureAdObjectId?: string;
};

/**
 * Formats seconds into `H:MM:SS` or `MM:SS`.
 *
 * @param totalSeconds - Duration in seconds.
 * @returns Human-readable time string.
 */
const formatDuration = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = sec.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/**
 * Recordings report page component.
 */
const RecordingsReportPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();

  const [rows, setRows] = useState<RecordingRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Preview modal
  const [preview, setPreview] = useState<RecordingRow | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Delete modal
  const [toDelete, setToDelete] = useState<RecordingRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useHeader({
    title: "Recordings",
    iconSrc: recordingsIcon,
    iconAlt: "Recordings",
  });

  /**
   * Loads recordings from the backend (includes SAS link for playback).
   */
  const fetchRecordings = async () => {

    setLoading(true);
    try {
      const data: ListRecordingsResponse = await getRecordings({
        includeSas: true,
        sasMinutes: 60,
        limit: 100,
        order: "desc",
      });


      setRows(data.items ?? []);
    } catch (err) {
      console.error("[fetchRecordings] error:", err);
      showToast("Failed to load recordings", "error");
    } finally {
      setLoading(false);

    }
  };

  useEffect(() => {

    if (!initialized) return;
    fetchRecordings();
  }, [initialized]);

  /**
   * Opens delete confirmation modal for a given row.
   *
   * @param r - Recording row.
   */
  const openDeleteModal = (r: RecordingRow) => {
    setToDelete(r);
    setDeleteOpen(true);
  };

  /**
   * Confirms deletion and refreshes the list.
   */
  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteRecording(toDelete.id);
      showToast("Recording deleted", "success");
      fetchRecordings();
    } catch (err) {
      console.error("[deleteRecording] error:", err);
      showToast("Failed to delete recording", "error");
    } finally {
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  /**
   * Opens the preview modal when a playable URL exists.
   *
   * @param r - Recording row to preview.
   */
  const handlePreview = (r: RecordingRow) => {
    if (!r.playbackUrl && !r.blobUrl) {
      showToast("Recording is not yet available for playback", "warning");
      return;
    }
    setPreview(r);
    setPreviewOpen(true);
  };

  /**
   * Downloads the video to the user's device using a temporary blob URL.
   *
   * @param r - Recording row to download.
   */
  const handleDownload = async (r: RecordingRow) => {
    const url = r.playbackUrl || r.blobUrl;
    if (!url) {
      showToast("No downloadable URL available yet", "warning");
      return;
    }
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `recording-${r.roomName}-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("[handleDownload] error:", err);
      showToast("Download failed", "error");
    }
  };

  /**
   * Columns for TableComponent.
   * Text columns (with `key` and no `render`) are searchable by the built-in filter.
   */
  const columns: Column<RecordingRow>[] = [
    { key: "recordedBy", header: "Recorded By" },
    { key: "username", header: "Subject" },
    { key: "status", header: "Status" },
    {
      key: "duration",
      header: "Duration",
      render: (row) => formatDuration(row.duration),
    },
    {
      key: "startedAt",
      header: "Date & Time",
      render: (row) => {
        const dt = new Date(row.startedAt);
        return isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
      },
    },
    {
      key: "playback",
      header: "Playback",
      render: (row) => (
        <button
          onClick={() => handlePreview(row)}
          className="p-1 hover:text-[var(--color-secondary)]"
          disabled={!(row.playbackUrl || row.blobUrl)}
          title={row.playbackUrl || row.blobUrl ? "Preview" : "Not available"}
        >
          ▶️
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex space-x-2">
          <TrashButton onClick={() => openDeleteModal(row)} />
          <button
            onClick={() => handleDownload(row)}
            className="p-1 hover:text-[var(--color-secondary)]"
            disabled={!(row.playbackUrl || row.blobUrl)}
            title={row.playbackUrl || row.blobUrl ? "Download" : "Not available"}
          >
            📥
          </button>
        </div>
      ),
    },
  ];



  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
        <TableComponent<RecordingRow>
          columns={columns}
          data={rows}
          pageSize={10}
          loading={loading}
          loadingAction="Loading recordings"
          addButton={null}
        />
      </div>

      <AddModal
        open={previewOpen}
        title="Recording Preview"
        onClose={() => setPreviewOpen(false)}
        onConfirm={() => setPreviewOpen(false)}
        hideFooter={true}
        className="w-fit"
      >
        <div className="flex items-center justify-center min-h-[40vh]">
          {preview && (
            <video
              key={preview.id}
              controls
              className="max-w-full max-h-[75vh] rounded"
              src={preview.playbackUrl! || preview.blobUrl!}
            />
          )}
        </div>
      </AddModal>

      <AddModal
        open={deleteOpen}
        title="Confirm Delete"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        className="w-fit"
      >
        <p className="text-white">
          Are you sure you want to delete this recording?
        </p>
      </AddModal>
    </>
  );
};

export default RecordingsReportPage;
