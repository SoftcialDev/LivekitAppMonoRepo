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

export interface ICameraStartFailureRepository {
  create(data: CreateCameraStartFailureData): Promise<void>;
}


