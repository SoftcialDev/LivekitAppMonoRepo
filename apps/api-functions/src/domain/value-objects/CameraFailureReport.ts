import { CameraFailureStage } from "@prisma/client";
import { CameraStartFailureRequest } from "../schemas/CameraStartFailureSchema";
import { getCentralAmericaTimeISO } from '../../utils/dateUtils';
import { AttemptResult } from '../enums/AttemptResult';
import { NormalizedAttempt, NormalizedDevice } from '../types/CameraFailureTypes';

export class CameraFailureReport {
  readonly userAdId!: string;
  readonly userEmail?: string;
  readonly stage!: CameraFailureStage;
  readonly errorName?: string;
  readonly errorMessage?: string;
  readonly deviceCount?: number;
  readonly devicesSnapshot?: NormalizedDevice[];
  readonly attempts?: NormalizedAttempt[];
  readonly metadata?: Record<string, unknown>;
  readonly createdAtCentralAmerica!: string;

  private constructor(init: CameraFailureReport) {
    Object.assign(this, init);
  }

  static fromRequest(
    req: CameraStartFailureRequest & { userAdId: string; userEmail?: string }
  ): CameraFailureReport {
    const devices = (req.devicesSnapshot ?? []).slice(0, 15).map((d) => ({
      label: typeof d.label === "string" ? d.label.slice(0, 200) : d.label ?? null,
      deviceId: d.deviceId ? d.deviceId.slice(0, 256) : null,
      groupId: d.groupId ? d.groupId.slice(0, 256) : undefined,
      vendorId: d.vendorId?.slice(0, 8),
      productId: d.productId?.slice(0, 8),
    }));

    const attempts = (req.attempts ?? []).slice(0, 20).map((a) => ({
      label: a.label ? a.label.slice(0, 200) : a.label,
      deviceId: a.deviceId ? a.deviceId.slice(0, 256) : a.deviceId,
      result: (a.result as AttemptResult) ?? AttemptResult.Other,
      errorName: a.errorName?.slice(0, 100),
      errorMessage: a.errorMessage?.slice(0, 500),
    }));

    const createdAtCentralAmerica = getCentralAmericaTimeISO();

    return new CameraFailureReport({
      userAdId: req.userAdId,
      userEmail: req.userEmail,
      stage: req.stage,
      errorName: req.errorName?.slice(0, 100),
      errorMessage: req.errorMessage?.slice(0, 1000),
      deviceCount: req.deviceCount ?? devices.length,
      devicesSnapshot: devices,
      attempts,
      metadata: req.metadata as Record<string, unknown> | undefined,
      createdAtCentralAmerica,
    } as unknown as CameraFailureReport);
  }

  toPersistence(): Record<string, unknown> {
    return {
      userAdId: this.userAdId,
      userEmail: this.userEmail,
      stage: this.stage,
      errorName: this.errorName,
      errorMessage: this.errorMessage,
      deviceCount: this.deviceCount,
      devicesSnapshot: this.devicesSnapshot,
      attempts: this.attempts,
      metadata: this.metadata,
      createdAtCentralAmerica: this.createdAtCentralAmerica,
    };
  }
}


