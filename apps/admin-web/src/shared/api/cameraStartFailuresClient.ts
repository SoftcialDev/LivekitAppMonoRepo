import apiClient from './apiClient'

export enum AttemptResult {
  OK = 'ok',
  NotReadableError = 'NotReadableError',
  Other = 'other',
}

export interface DeviceSnapshotDto {
  label: string | null
  deviceId: string | null
  groupId?: string | null
  vendorId?: string
  productId?: string
}

export interface AttemptDto {
  label?: string | null
  deviceId?: string | null
  result: AttemptResult
  errorName?: string
  errorMessage?: string
}

export interface CameraStartFailureRequest {
  stage: 'Permission'|'Enumerate'|'TrackCreate'|'LiveKitConnect'|'Publish'|'Unknown'
  errorName?: string
  errorMessage?: string
  deviceCount?: number
  devicesSnapshot?: DeviceSnapshotDto[]
  attempts?: AttemptDto[]
  metadata?: Record<string, any>
}

export async function sendCameraStartFailure(payload: CameraStartFailureRequest): Promise<void> {
  await apiClient.post('/api/CameraStartFailures', payload)
}


