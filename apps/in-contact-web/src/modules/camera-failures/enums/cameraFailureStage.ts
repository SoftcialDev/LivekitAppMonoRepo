/**
 * @fileoverview CameraFailureStage - Enum for camera failure stages
 * @summary Enumeration of camera failure stages
 * @description Defines the stages where camera failures can occur
 */

/**
 * Enumeration of camera failure stages
 */
export enum CameraFailureStage {
  Permission = 'Permission',
  Enumerate = 'Enumerate',
  TrackCreate = 'TrackCreate',
  LiveKitConnect = 'LiveKitConnect',
  Publish = 'Publish',
  Unknown = 'Unknown',
}

