import prisma from '../database/PrismaClientService';
import {
  IServiceAccountCredentialRepository,
  ServiceAccountCredentialRecord
} from '../../domain/interfaces/IServiceAccountCredentialRepository';

/**
 * @fileoverview ServiceAccountCredentialRepository
 * @description Prisma-backed repository for storing service account credentials.
 */
export class ServiceAccountCredentialRepository implements IServiceAccountCredentialRepository {
  /**
   * Retrieves the most recently stored service account credential.
   *
   * @returns The latest credential record or null when none exist.
   */
  async findLatest(): Promise<ServiceAccountCredentialRecord | null> {
    const record = await prisma.serviceAccountCredential.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return record ? this.map(record) : null;
  }

  /**
   * Inserts or updates the stored credential for the service account.
   *
   * @param credential - Credential payload to persist.
   * @returns The stored credential record.
   */
  async upsert(credential: {
    azureAdObjectId: string;
    userPrincipalName: string;
    displayName: string;
    encryptedPassword: string;
  }): Promise<ServiceAccountCredentialRecord> {
    const record = await prisma.serviceAccountCredential.upsert({
      where: { userPrincipalName: credential.userPrincipalName.toLowerCase() },
      update: {
        azureAdObjectId: credential.azureAdObjectId,
        displayName: credential.displayName,
        encryptedPassword: credential.encryptedPassword
      },
      create: {
        azureAdObjectId: credential.azureAdObjectId,
        userPrincipalName: credential.userPrincipalName.toLowerCase(),
        displayName: credential.displayName,
        encryptedPassword: credential.encryptedPassword
      }
    });

    return this.map(record);
  }

  /**
   * Maps the Prisma model to the repository record interface.
   *
   * @param record - Raw Prisma record.
   * @returns Repository-friendly record structure.
   */
  private map(record: any): ServiceAccountCredentialRecord {
    return {
      id: record.id,
      azureAdObjectId: record.azureAdObjectId,
      userPrincipalName: record.userPrincipalName,
      displayName: record.displayName,
      encryptedPassword: record.encryptedPassword,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
