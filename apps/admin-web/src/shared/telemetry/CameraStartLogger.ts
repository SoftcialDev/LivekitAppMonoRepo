import { CameraStartFailureRequest, AttemptDto, DeviceSnapshotDto, AttemptResult, sendCameraStartFailure } from '../api/cameraStartFailuresClient'

type Stage = CameraStartFailureRequest['stage']

function parseVidPidFromLabel(label?: string | null): { vendorId?: string; productId?: string } {
  if (!label) return {}
  const m = label.match(/\(([0-9A-Fa-f]{4}):([0-9A-Fa-f]{4})\)/)
  if (!m) return {}
  return { vendorId: m[1], productId: m[2] }
}

export class CameraStartLogger {
  private devicesSnapshot: DeviceSnapshotDto[] = []
  private attempts: AttemptDto[] = []
  private begun = false
  private userAdId?: string
  private userEmail?: string

  begin(userAdId?: string, userEmail?: string): void {
    this.begun = true
    this.userAdId = userAdId
    this.userEmail = userEmail
    this.devicesSnapshot = []
    this.attempts = []
  }

  snapshotDevices(devices: MediaDeviceInfo[]): void {
    if (!this.begun) this.begin()
    const cams = devices.filter(d => d.kind === 'videoinput')
    this.devicesSnapshot = cams.slice(0, 15).map(d => {
      const parsed = parseVidPidFromLabel(d.label)
      return {
        label: d.label || null,
        deviceId: d.deviceId || null,
        groupId: (d as any).groupId || null,
        vendorId: parsed.vendorId,
        productId: parsed.productId,
      }
    })
  }

  recordAttempt(a: AttemptDto): void {
    if (!this.begun) this.begin()
    const clean: AttemptDto = {
      label: a.label ?? null,
      deviceId: a.deviceId ?? null,
      result: a.result,
      errorName: a.errorName?.slice(0, 100),
      errorMessage: a.errorMessage?.slice(0, 500),
    }
    this.attempts.push(clean)
    if (this.attempts.length > 20) this.attempts = this.attempts.slice(-20)
  }

  async fail(stage: Stage, errorName?: string, errorMessage?: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.begun) this.begin()
    try {
      const payload: CameraStartFailureRequest = {
        stage,
        errorName,
        errorMessage,
        deviceCount: this.devicesSnapshot.length,
        devicesSnapshot: this.devicesSnapshot,
        attempts: this.attempts,
        metadata: {
          ...metadata,
          userAdId: this.userAdId,
          userEmail: this.userEmail,
        },
      }
      console.log('[CameraStartLogger] Sending payload:', JSON.stringify(payload, null, 2))
      await sendCameraStartFailure(payload)
    } catch (e) {
      console.warn('[CameraStartLogger] Failed to send failure payload', e)
    } finally {
      this.clear()
    }
  }

  clear(): void {
    this.devicesSnapshot = []
    this.attempts = []
    this.begun = false
  }
}


