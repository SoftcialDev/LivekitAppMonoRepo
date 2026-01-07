/**
 * @fileoverview ICameraStartFailureRepository - Interface for camera start failure data access
 * @description Defines the contract for camera start failure repository operations
 */

import { CreateCameraStartFailureData, CameraFailureQueryParams, CameraStartFailure } from '../types/CameraFailureTypes';

export interface ICameraStartFailureRepository {
  create(data: CreateCameraStartFailureData): Promise<void>;
  list(params?: CameraFailureQueryParams): Promise<CameraStartFailure[]>;
  findById(id: string): Promise<CameraStartFailure | null>;
  count(params?: CameraFailureQueryParams): Promise<number>;
}


