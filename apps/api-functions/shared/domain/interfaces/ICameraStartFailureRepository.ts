import { CameraFailureStage } from '@prisma/client';

export interface CreateCameraStartFailureData {
  userAdId: string;
  userEmail?: string;
  stage: CameraFailureStage;
  errorName?: string;
  errorMessage?: string;
  deviceCount?: number;
  devicesSnapshot?: unknown;
  attempts?: unknown;
  metadata?: unknown;
  createdAtCentralAmerica: string;
}

export interface CameraFailureQueryParams {
  stage?: CameraFailureStage;
  userEmail?: string;
  userAdId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ICameraStartFailureRepository {
  create(data: CreateCameraStartFailureData): Promise<void>;
  list(params?: CameraFailureQueryParams): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  count(params?: CameraFailureQueryParams): Promise<number>;
}


