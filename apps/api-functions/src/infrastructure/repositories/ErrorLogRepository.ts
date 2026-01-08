/**
 * @fileoverview ErrorLogRepository - Infrastructure repository for error log data access
 * @summary Handles all database operations related to error logs
 * @description Repository for error log data access operations
 */

import prisma from '../database/PrismaClientService';
import { IErrorLogRepository } from '../../domain/interfaces/IErrorLogRepository';
import { CreateErrorLogData, ErrorLogQueryParams } from '../../domain/types/ErrorLogTypes';
import { ApiErrorLog } from '../../domain/entities/ApiErrorLog';
import { ErrorSeverity } from '../../domain/enums/ErrorSeverity';
import { ErrorSource } from '../../domain/enums/ErrorSource';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { wrapEntityCreationError, wrapDatabaseQueryError, wrapEntityDeletionError, wrapEntityUpdateError } from '../../utils/error/ErrorHelpers';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

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
      const prismaErrorLog = await prisma.apiErrorLog.create({
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
          context: data.context ? (data.context as Prisma.InputJsonValue) : Prisma.JsonNull,
          resolved: false,
          createdAt: getCentralAmericaTime()
        }
      });

      return ApiErrorLog.fromPrisma({
        id: prismaErrorLog.id,
        severity: prismaErrorLog.severity,
        source: prismaErrorLog.source,
        endpoint: prismaErrorLog.endpoint,
        functionName: prismaErrorLog.functionName ?? null,
        errorName: prismaErrorLog.errorName,
        errorMessage: prismaErrorLog.errorMessage,
        stackTrace: prismaErrorLog.stackTrace,
        httpStatusCode: prismaErrorLog.httpStatusCode,
        userId: prismaErrorLog.userId,
        userEmail: prismaErrorLog.userEmail,
        requestId: prismaErrorLog.requestId,
        context: prismaErrorLog.context && typeof prismaErrorLog.context === 'object' && !Array.isArray(prismaErrorLog.context)
          ? (prismaErrorLog.context as Record<string, unknown>)
          : null,
        resolved: prismaErrorLog.resolved,
        resolvedAt: prismaErrorLog.resolvedAt,
        resolvedBy: prismaErrorLog.resolvedBy,
        createdAt: prismaErrorLog.createdAt
      });
    } catch (error: unknown) {
      throw wrapEntityCreationError('Failed to create error log', error);
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
      const where: Prisma.ApiErrorLogWhereInput = {};

      if (params?.source) {
        where.source = params.source as ErrorSource;
      }

      if (params?.severity) {
        where.severity = params.severity as ErrorSeverity;
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

      const prismaErrorLogs = await prisma.apiErrorLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: params?.limit || 100,
        skip: params?.offset || 0
      });

      return prismaErrorLogs.map((errorLog) => ApiErrorLog.fromPrisma({
        id: errorLog.id,
        severity: errorLog.severity,
        source: errorLog.source,
        endpoint: errorLog.endpoint,
        functionName: errorLog.functionName ?? null,
        errorName: errorLog.errorName,
        errorMessage: errorLog.errorMessage,
        stackTrace: errorLog.stackTrace,
        httpStatusCode: errorLog.httpStatusCode,
        userId: errorLog.userId,
        userEmail: errorLog.userEmail,
        requestId: errorLog.requestId,
        context: errorLog.context && typeof errorLog.context === 'object' && !Array.isArray(errorLog.context)
          ? (errorLog.context as Record<string, unknown>)
          : null,
        resolved: errorLog.resolved,
        resolvedAt: errorLog.resolvedAt,
        resolvedBy: errorLog.resolvedBy,
        createdAt: errorLog.createdAt
      }));
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find error logs', error);
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
      const prismaErrorLog = await prisma.apiErrorLog.findUnique({
        where: { id }
      });

      return prismaErrorLog ? ApiErrorLog.fromPrisma({
        id: prismaErrorLog.id,
        severity: prismaErrorLog.severity,
        source: prismaErrorLog.source,
        endpoint: prismaErrorLog.endpoint,
        functionName: prismaErrorLog.functionName ?? null,
        errorName: prismaErrorLog.errorName,
        errorMessage: prismaErrorLog.errorMessage,
        stackTrace: prismaErrorLog.stackTrace,
        httpStatusCode: prismaErrorLog.httpStatusCode,
        userId: prismaErrorLog.userId,
        userEmail: prismaErrorLog.userEmail,
        requestId: prismaErrorLog.requestId,
        context: prismaErrorLog.context && typeof prismaErrorLog.context === 'object' && !Array.isArray(prismaErrorLog.context)
          ? (prismaErrorLog.context as Record<string, unknown>)
          : null,
        resolved: prismaErrorLog.resolved,
        resolvedAt: prismaErrorLog.resolvedAt,
        resolvedBy: prismaErrorLog.resolvedBy,
        createdAt: prismaErrorLog.createdAt
      }) : null;
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to find error log by id', error);
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
      await prisma.apiErrorLog.update({
        where: { id },
        data: {
          resolved: true,
          resolvedAt: getCentralAmericaTime(),
          resolvedBy
        }
      });
    } catch (error: unknown) {
      throw wrapEntityUpdateError('Failed to mark error log as resolved', error);
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
      await prisma.apiErrorLog.delete({
        where: { id }
      });
    } catch (error: unknown) {
      throw wrapEntityDeletionError('Failed to delete error log', error);
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
      await prisma.apiErrorLog.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      });
    } catch (error: unknown) {
      throw wrapEntityDeletionError('Failed to delete error logs', error);
    }
  }

  /**
   * Deletes all error logs from the database
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if the database operation fails
   */
  async deleteAll(): Promise<void> {
    try {
      await prisma.apiErrorLog.deleteMany({});
    } catch (error: unknown) {
      throw wrapEntityDeletionError('Failed to delete all error logs', error);
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
      const where: Prisma.ApiErrorLogWhereInput = {};

      if (params?.source) {
        where.source = params.source as ErrorSource;
      }

      if (params?.severity) {
        where.severity = params.severity as ErrorSeverity;
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

      const count = await prisma.apiErrorLog.count({
        where
      });

      return count;
    } catch (error: unknown) {
      throw wrapDatabaseQueryError('Failed to count error logs', error);
    }
  }
}

