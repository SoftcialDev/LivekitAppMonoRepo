/**
 * @fileoverview Camera Failure utility functions
 * @summary Utility functions for camera failure data formatting
 * @description Provides utility functions for formatting and displaying camera failure data
 */

import { CameraFailureStage } from '../enums/cameraFailureStage';
import { formatDateTimeUtc } from '@/shared/utils/dateUtils';

/**
 * Gets the color class for a camera failure stage
 * 
 * @param stage - The camera failure stage
 * @returns Tailwind CSS color class for the stage
 */
export function getStageColorClass(stage: string): string {
  switch (stage) {
    case CameraFailureStage.Permission:
      return 'text-red-500';
    case CameraFailureStage.Enumerate:
      return 'text-orange-500';
    case CameraFailureStage.TrackCreate:
      return 'text-yellow-500';
    case CameraFailureStage.LiveKitConnect:
      return 'text-blue-500';
    case CameraFailureStage.Publish:
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Formats a date string for display using UTC formatting
 * 
 * @param date - Date string or undefined
 * @returns Formatted date string or 'N/A'
 */
export function formatCameraFailureDate(date: string | undefined): string {
  if (!date) return 'N/A';
  return formatDateTimeUtc(date);
}

