import { CameraFailureStage } from "@prisma/client";
import { CameraStartFailureRequest } from "../schemas/CameraStartFailureSchema";
import { nowCRIso } from "../../utils/timezone";
import { AttemptResult, NormalizedAttempt, NormalizedDevice } from "../interfaces/CameraFailureTypes";

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
      deviceIdHash: typeof d.deviceIdHash === "string" ? d.deviceIdHash.slice(0, 128) : d.deviceIdHash ?? null,
      vendorId: d.vendorId?.slice(0, 8),
      productId: d.productId?.slice(0, 8),
    }));

    const attempts = (req.attempts ?? []).slice(0, 20).map((a) => ({
      label: a.label ? a.label.slice(0, 200) : a.label,
      deviceIdHash: a.deviceIdHash ? a.deviceIdHash.slice(0, 128) : a.deviceIdHash,
      result: (a.result as AttemptResult) ?? AttemptResult.Other,
      errorName: a.errorName?.slice(0, 100),
      errorMessage: a.errorMessage?.slice(0, 500),
    }));

    const createdAtCentralAmerica = nowCRIso();

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
    } as CameraFailureReport);
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


