/**
 * @fileoverview ICameraStartFailureRepository - Interface for camera start failure data access
 * @description Defines the contract for camera start failure repository operations
 */

import { CreateCameraStartFailureData, CameraFailureQueryParams } from '../types/CameraFailureTypes';

export interface ICameraStartFailureRepository {
  create(data: CreateCameraStartFailureData): Promise<void>;
  list(params?: CameraFailureQueryParams): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  count(params?: CameraFailureQueryParams): Promise<number>;
}


