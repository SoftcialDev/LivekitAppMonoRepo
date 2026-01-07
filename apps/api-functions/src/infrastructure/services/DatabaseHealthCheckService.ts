/**
 * @fileoverview DatabaseHealthCheckService - Infrastructure service for database health checks
 * @summary Provides database connectivity testing for health checks
 * @description Infrastructure service that tests database connectivity using Prisma
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { HealthStatus } from '../../domain/enums/HealthStatus';
import { DatabaseCheck } from '../../domain/types/HealthCheckTypes';

/**
 * Infrastructure service for database health checks
 * @description Handles database connectivity testing
 */
export class DatabaseHealthCheckService {
  /**
   * Tests database connectivity by running a simple SELECT 1 query
   * @param databaseUrl - Database connection string
   * @param verbose - If true, includes full error details (name, message, stack) in response
   * @returns Database check result with status and message
   */
  async checkDatabaseConnectivity(databaseUrl: string, verbose: boolean): Promise<DatabaseCheck> {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);
      const prisma = new PrismaClient({ adapter });

      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: HealthStatus.OK, message: "Database connectivity OK (SELECT 1 succeeded)." };
      } finally {
        await prisma.$disconnect().catch(() => undefined);
        await pool.end().catch(() => undefined);
      }
    } catch (err: unknown) {
      const error = err as Error;
      return {
        status: HealthStatus.FAIL,
        message: "Database connectivity failed.",
        details: verbose
          ? { name: error?.name, message: error?.message, stack: error?.stack }
          : { message: error?.message ?? String(err) }
      };
    }
  }

  /**
   * Fetches all users from the database for health check
   * @param databaseUrl - Database connection string
   * @returns Array of users or error object
   */
  async fetchUsers(databaseUrl: string): Promise<Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    azureAdObjectId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }> | { error: string }> {
    try {
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);
      const prisma = new PrismaClient({ adapter });

      try {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            azureAdObjectId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true
          },
          orderBy: {
            email: 'asc'
          }
        });
        return users;
      } finally {
        await prisma.$disconnect().catch(() => undefined);
        await pool.end().catch(() => undefined);
      }
    } catch (err: unknown) {
      const error = err as Error;
      return {
        error: error?.message ?? String(err)
      };
    }
  }
}

