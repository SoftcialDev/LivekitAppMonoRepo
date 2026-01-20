/**
 * @fileoverview CameraStartFailureRepository - Repository for camera start failure data access
 * @summary Implements data access operations for camera start failures
 * @description Provides Prisma-based implementation of camera start failure repository operations
 */

import prisma from "../database/PrismaClientService";
import { ICameraStartFailureRepository } from '../../domain/interfaces/ICameraStartFailureRepository';
import { CreateCameraStartFailureData, CameraFailureQueryParams, CameraStartFailure } from '../../domain/types/CameraFailureTypes';
import { Prisma, CameraFailureStage, CommandType } from '@prisma/client';

/**
 * Repository for camera start failure data access
 * @description Implements ICameraStartFailureRepository using Prisma for database operations
 */
export class CameraStartFailureRepository implements ICameraStartFailureRepository {
  /**
   * Creates a new camera start failure record
   * @param data - Camera start failure data to create
   * @returns Promise that resolves when the record is created
   */
  async create(data: CreateCameraStartFailureData): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: data.userAdId },
      select: { id: true },
    });

    // Find the email of the user who initiated the START command that led to this failure
    const initiatedByEmail = await this.findInitiatorEmailForFailure(data.userAdId, user?.id);

    await prisma.cameraStartFailure.create({
      data: {
        userId: user?.id,
        userAdId: data.userAdId,
        userEmail: data.userEmail,
        stage: data.stage,
        errorName: data.errorName,
        errorMessage: data.errorMessage,
        deviceCount: data.deviceCount ?? undefined,
        devicesSnapshot: data.devicesSnapshot ? (data.devicesSnapshot as Prisma.InputJsonValue) : undefined,
        attempts: data.attempts ? (data.attempts as Prisma.InputJsonValue) : undefined,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        createdAtCentralAmerica: data.createdAtCentralAmerica,
        initiatedByEmail: initiatedByEmail || undefined,
      },
    });
  }

  /**
   * Finds the email of the user who initiated the START command that led to this failure
   * @param userAdId - Azure AD Object ID of the PSO who reported the failure
   * @param userId - Database ID of the PSO (optional, will be looked up if not provided)
   * @returns Email of the initiator or null if not found
   * @private
   */
  private async findInitiatorEmailForFailure(userAdId: string, userId?: string | null): Promise<string | null> {
    let psoId: string | null = userId || null;

    // If userId not provided, find user by userAdId
    if (!psoId) {
      const user = await prisma.user.findUnique({
        where: { azureAdObjectId: userAdId },
        select: { id: true }
      });
      psoId = user?.id || null;
    }

    if (!psoId) {
      return null; // PSO not found in database
    }

    // Find recent START command for this PSO (within last 10 minutes)
    // We search backwards from now since the failure just occurred
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const recentCommand = await prisma.pendingCommand.findFirst({
      where: {
        employeeId: psoId,
        command: CommandType.START,
        timestamp: {
          gte: tenMinutesAgo
        },
        initiatedById: { not: null }
      },
      orderBy: { timestamp: 'desc' },
      include: {
        initiatedBy: {
          select: { email: true }
        }
      }
    });

    return recentCommand?.initiatedBy?.email || null;
  }

  /**
   * Lists camera start failures matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an array of camera start failure records
   */
  async list(params?: CameraFailureQueryParams): Promise<CameraStartFailure[]> {
    const where = this.buildWhereClause(params);

    const failures = await prisma.cameraStartFailure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
      skip: params?.offset,
      include: {
        user: {
          select: { id: true }
        }
      }
    });

    // Map failures to domain type - initiatedByEmail is already stored in the database
    return failures.map(failure => this.mapToCameraStartFailure(failure));
  }

  /**
   * Finds a camera start failure by its identifier
   * @param id - Camera start failure identifier
   * @returns Promise that resolves to the camera start failure record or null if not found
   */
  async findById(id: string): Promise<CameraStartFailure | null> {
    const failure = await prisma.cameraStartFailure.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true }
        }
      }
    });

    if (!failure) {
      return null;
    }

    // Map to domain type - initiatedByEmail is already stored in the database
    return this.mapToCameraStartFailure(failure);
  }

  /**
   * Maps Prisma model to domain type
   * @param prismaFailure - Prisma camera start failure model
   * @returns CameraStartFailure domain type
   */
  private mapToCameraStartFailure(prismaFailure: {
    id: string;
    userId: string | null;
    userAdId: string;
    userEmail: string | null;
    stage: CameraFailureStage;
    errorName: string | null;
    errorMessage: string | null;
    deviceCount: number | null;
    devicesSnapshot: unknown;
    attempts: unknown;
    metadata: unknown;
    createdAt: Date;
    createdAtCentralAmerica: string | null;
    initiatedByEmail?: string | null;
  }): CameraStartFailure {
    return {
      id: prismaFailure.id,
      userId: prismaFailure.userId,
      userAdId: prismaFailure.userAdId,
      userEmail: prismaFailure.userEmail,
      stage: prismaFailure.stage,
      errorName: prismaFailure.errorName,
      errorMessage: prismaFailure.errorMessage,
      deviceCount: prismaFailure.deviceCount,
      devicesSnapshot: prismaFailure.devicesSnapshot,
      attempts: prismaFailure.attempts,
      metadata: prismaFailure.metadata,
      createdAt: prismaFailure.createdAt,
      createdAtCentralAmerica: prismaFailure.createdAtCentralAmerica,
      initiatedByEmail: prismaFailure.initiatedByEmail || null,
    };
  }

  /**
   * Counts camera start failures matching the specified query parameters
   * @param params - Query parameters for filtering
   * @returns Promise that resolves to the total count
   */
  async count(params?: CameraFailureQueryParams): Promise<number> {
    const where = this.buildWhereClause(params);
    return await prisma.cameraStartFailure.count({ where });
  }

  /**
   * Builds Prisma where clause from query parameters
   * @param params - Query parameters for filtering
   * @returns Prisma where clause object
   */
  private buildWhereClause(params?: CameraFailureQueryParams): Prisma.CameraStartFailureWhereInput {
    const where: Prisma.CameraStartFailureWhereInput = {};

    if (params?.stage) {
      where.stage = params.stage;
    }

    if (params?.userEmail) {
      where.userEmail = { contains: params.userEmail, mode: 'insensitive' };
    }

    if (params?.userAdId) {
      where.userAdId = params.userAdId;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    return where;
  }
}


