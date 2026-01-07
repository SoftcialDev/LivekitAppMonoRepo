import { z } from "zod";
import { CameraFailureStage } from "@prisma/client";
import { AttemptResult } from '../enums/AttemptResult';

/**
 * Zod schema for camera start failure reports.
 * Only sent when the client's camera/video start flow fails.
 */
export const cameraStartFailureSchema = z.object({
  stage: z.nativeEnum(CameraFailureStage),
  errorName: z.string().max(100).optional(),
  errorMessage: z.string().max(1000).optional(),
  deviceCount: z.number().int().min(0).optional(),
  devicesSnapshot: z
    .array(
      z.object({
        label: z.string().max(200).nullable(),
        deviceId: z.string().max(256).nullable(),
        groupId: z.string().max(256).nullable().optional(),
        vendorId: z.string().max(8).optional(),
        productId: z.string().max(8).optional(),
      })
    )
    .max(15)
    .optional(),
  attempts: z
    .array(
      z.object({
        label: z.string().max(200).nullable().optional(),
        deviceId: z.string().max(256).nullable().optional(),
        result: z.nativeEnum(AttemptResult),
        errorName: z.string().max(100).optional(),
        errorMessage: z.string().max(500).optional(),
      })
    )
    .max(20)
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export type CameraStartFailureRequest = z.infer<typeof cameraStartFailureSchema>;


