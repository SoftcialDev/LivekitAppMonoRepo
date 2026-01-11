/**
 * @fileoverview Type definitions for Recording Report page
 * @summary Interfaces for recording report page configuration
 * @description Defines interfaces used in recording report page configuration
 */

import type { RecordingReport } from '../../types/recordingTypes';

/**
 * Handlers required for recording report columns
 */
export interface IRecordingReportColumnHandlers {
  /**
   * Handler for opening preview modal
   */
  handlePreview: (recording: RecordingReport) => void;

  /**
   * Handler for opening delete confirmation modal
   */
  openDeleteModal: (recording: RecordingReport) => void;

  /**
   * Handler for downloading recording
   */
  handleDownload: (recording: RecordingReport) => Promise<void>;
}

