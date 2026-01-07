import prisma from "../database/PrismaClientService";
import { ICameraStartFailureRepository, CreateCameraStartFailureData, CameraFailureQueryParams } from '../../index';

export class CameraStartFailureRepository implements ICameraStartFailureRepository {
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
        devicesSnapshot: (data.devicesSnapshot ?? undefined) as any,
        attempts: (data.attempts ?? undefined) as any,
        metadata: (data.metadata ?? undefined) as any,
        createdAtCentralAmerica: data.createdAtCentralAmerica,
      },
    });
  }

  async list(params?: CameraFailureQueryParams): Promise<any[]> {
    const where: any = {};

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

    const failures = await prisma.cameraStartFailure.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.limit,
      skip: params?.offset,
    });

    return failures;
  }

  async findById(id: string): Promise<any | null> {
    return await prisma.cameraStartFailure.findUnique({
      where: { id },
    });
  }

  async count(params?: CameraFailureQueryParams): Promise<number> {
    const where: any = {};

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

    return await prisma.cameraStartFailure.count({ where });
  }
}


