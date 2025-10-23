import prisma from "../database/PrismaClientService";
import { ICameraStartFailureRepository, CreateCameraStartFailureData } from "../../domain/interfaces/ICameraStartFailureRepository";

export class CameraStartFailureRepository implements ICameraStartFailureRepository {
  async create(data: CreateCameraStartFailureData): Promise<void> {
    // Try to resolve FK to User by Azure AD object id
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
}


