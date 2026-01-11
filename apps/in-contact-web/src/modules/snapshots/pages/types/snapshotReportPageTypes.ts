/**
 * @fileoverview Type definitions for Snapshot Report page
 * @summary Interfaces for snapshot report page configuration
 * @description Defines interfaces used in snapshot report page configuration
 */

import type { SnapshotReport } from '../../types/snapshotTypes';

/**
 * Handlers required for snapshot report columns
 */
export interface ISnapshotReportColumnHandlers {
  /**
   * Handler for viewing snapshot preview
   */
  handleView: (report: SnapshotReport) => void;

  /**
   * Handler for opening delete confirmation modal
   */
  openDeleteModal: (report: SnapshotReport) => void;

  /**
   * Handler for downloading snapshot
   */
  handleDownload: (report: SnapshotReport) => Promise<void>;
}

