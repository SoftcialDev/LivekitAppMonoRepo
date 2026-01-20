/**
 * @fileoverview CameraStartFailureRepository - Repository for camera start failure data access
 * @summary Implements data access operations for camera start failures
 * @description Provides Prisma-based implementation of camera start failure repository operations
 */

import prisma from "../database/PrismaClientService";
import { ICameraStartFailureRepository } from '../../domain/interfaces/ICameraStartFailureRepository';
import { CreateCameraStartFailureData, CameraFailureQueryParams, CameraStartFailure } from '../../domain/types/CameraFailureTypes';
import { Prisma, CameraFailureStage } from '@prisma/client';

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
      },
    });
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

    // Enrich each failure with callerId (initiator email) from recent START command
    const enrichedFailures = await Promise.all(
      failures.map(async (failure) => {
        let callerEmail: string | null = null;
        
        if (failure.user?.id) {
          // Find recent START command for this PSO (within 5 minutes before failure)
          const fiveMinutesAgo = new Date(failure.createdAt);
          fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
          
          const recentCommand = await prisma.pendingCommand.findFirst({
            where: {
              employeeId: failure.user.id,
              command: 'START',
              timestamp: {
                gte: fiveMinutesAgo,
                lte: failure.createdAt
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
          
          if (recentCommand?.initiatedBy?.email) {
            callerEmail = recentCommand.initiatedBy.email;
          }
        }
        
        return {
          ...this.mapToCameraStartFailure(failure),
          callerEmail
        };
      })
    );

    return enrichedFailures;
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

    // Enrich with callerId (initiator email) from recent START command
    let callerEmail: string | null = null;
    
    if (failure.user?.id) {
      const fiveMinutesAgo = new Date(failure.createdAt);
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const recentCommand = await prisma.pendingCommand.findFirst({
        where: {
          employeeId: failure.user.id,
          command: 'START',
          timestamp: {
            gte: fiveMinutesAgo,
            lte: failure.createdAt
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
      
      if (recentCommand?.initiatedBy?.email) {
        callerEmail = recentCommand.initiatedBy.email;
      }
    }

    return {
      ...this.mapToCameraStartFailure(failure),
      callerEmail
    };
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


