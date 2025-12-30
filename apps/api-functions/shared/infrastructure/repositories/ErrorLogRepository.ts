/**
 * @fileoverview ErrorLogRepository - Infrastructure repository for error log data access
 * @summary Handles all database operations related to error logs
 * @description Repository for error log data access operations
 */

import prisma from '../database/PrismaClientService';
import { IErrorLogRepository, CreateErrorLogData, ErrorLogQueryParams } from '../../domain/interfaces/IErrorLogRepository';
import { ApiErrorLog } from '../../domain/entities/ApiErrorLog';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { randomUUID } from 'crypto';

/**
 * Repository for error log data access operations
 * @description Handles all database operations related to error logs
 */
export class ErrorLogRepository implements IErrorLogRepository {
  /**
   * Creates a new error log entry in the database
   * @param data - Error log data to persist
   * @returns Promise that resolves to the created error log entity
   * @throws Error if the database operation fails
   */
  async create(data: CreateErrorLogData): Promise<ApiErrorLog> {
    try {
      const prismaErrorLog = await (prisma as any).apiErrorLog.create({
        data: {
          id: randomUUID(),
          severity: data.severity,
          source: data.source,
          endpoint: data.endpoint,
          functionName: data.functionName,
          errorName: data.errorName,
          errorMessage: data.errorMessage,
          stackTrace: data.stackTrace,
          httpStatusCode: data.httpStatusCode,
          userId: data.userId,
          userEmail: data.userEmail,
          requestId: data.requestId,
          context: data.context as any,
          resolved: false,
          createdAt: getCentralAmericaTime()
        }
      });

      return ApiErrorLog.fromPrisma(prismaErrorLog);
    } catch (error: any) {
      throw new Error(`Failed to create error log: ${error.message}`);
    }
  }

  /**
   * Finds error logs matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an array of error log entities
   * @throws Error if the database query fails
   */
  async findMany(params?: ErrorLogQueryParams): Promise<ApiErrorLog[]> {
    try {
      const where: any = {};

      if (params?.source) {
        where.source = params.source;
      }

      if (params?.severity) {
        where.severity = params.severity;
      }

      if (params?.endpoint) {
        where.endpoint = params.endpoint;
      }

      if (params?.resolved !== undefined) {
        where.resolved = params.resolved;
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

      const prismaErrorLogs = await (prisma as any).apiErrorLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: params?.limit || 100,
        skip: params?.offset || 0
      });

      return prismaErrorLogs.map((errorLog: any) => ApiErrorLog.fromPrisma(errorLog));
    } catch (error: any) {
      throw new Error(`Failed to find error logs: ${error.message}`);
    }
  }

  /**
   * Finds an error log by its unique identifier
   * @param id - Error log identifier
   * @returns Promise that resolves to the error log entity or null if not found
   * @throws Error if the database query fails
   */
  async findById(id: string): Promise<ApiErrorLog | null> {
    try {
      const prismaErrorLog = await (prisma as any).apiErrorLog.findUnique({
        where: { id }
      });

      return prismaErrorLog ? ApiErrorLog.fromPrisma(prismaErrorLog) : null;
    } catch (error: any) {
      throw new Error(`Failed to find error log by id: ${error.message}`);
    }
  }

  /**
   * Marks an error log as resolved
   * @param id - Error log identifier
   * @param resolvedBy - User identifier who resolved the error
   * @returns Promise that resolves when the update is complete
   * @throws Error if the database operation fails
   */
  async markAsResolved(id: string, resolvedBy: string): Promise<void> {
    try {
      await (prisma as any).apiErrorLog.update({
        where: { id },
        data: {
          resolved: true,
          resolvedAt: getCentralAmericaTime(),
          resolvedBy
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to mark error log as resolved: ${error.message}`);
    }
  }

  /**
   * Deletes an error log by its unique identifier
   * @param id - Error log identifier
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  async deleteById(id: string): Promise<void> {
    try {
      await (prisma as any).apiErrorLog.delete({
        where: { id }
      });
    } catch (error: any) {
      throw new Error(`Failed to delete error log: ${error.message}`);
    }
  }

  /**
   * Deletes multiple error logs by their identifiers
   * @param ids - Array of error log identifiers
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await (prisma as any).apiErrorLog.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to delete error logs: ${error.message}`);
    }
  }

  /**
   * Deletes all error logs from the database
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  async deleteAll(): Promise<void> {
    try {
      await (prisma as any).apiErrorLog.deleteMany({});
    } catch (error: any) {
      throw new Error(`Failed to delete all error logs: ${error.message}`);
    }
  }

  /**
   * Counts error logs matching the specified query parameters (without pagination)
   * @param params - Query parameters for filtering (limit and offset are ignored)
   * @returns Promise that resolves to the total count of matching error logs
   * @throws Error if the database query fails
   */
  async count(params?: Omit<ErrorLogQueryParams, 'limit' | 'offset'>): Promise<number> {
    try {
      const where: any = {};

      if (params?.source) {
        where.source = params.source;
      }

      if (params?.severity) {
        where.severity = params.severity;
      }

      if (params?.endpoint) {
        where.endpoint = params.endpoint;
      }

      if (params?.resolved !== undefined) {
        where.resolved = params.resolved;
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

      const count = await (prisma as any).apiErrorLog.count({
        where
      });

      return count;
    } catch (error: any) {
      throw new Error(`Failed to count error logs: ${error.message}`);
    }
  }
}

