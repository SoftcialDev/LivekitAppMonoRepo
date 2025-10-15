/**
 * @fileoverview PrismaClientService - Infrastructure service for database access
 * @summary Singleton PrismaClient instance for database operations
 * @description Provides a single shared PrismaClient instance for database access across the application
 */

import { PrismaClient } from "@prisma/client";

/**
 * Singleton PrismaClient instance for database access.
 *
 * Using a single shared client throughout the application helps
 * manage connection pooling and prevents opening too many connections,
 * especially in serverless or development environments.
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/connection-management
 */
const prisma = new PrismaClient();

/**
 * Configures the database timezone to Central America Time
 * This ensures all database operations use the correct timezone
 */
async function configureDatabaseTimezone(): Promise<void> {
  try {
    await prisma.$executeRaw`SET timezone = 'America/Guatemala'`;
    console.log('✅ Database timezone configured to America/Guatemala');
  } catch (error) {
    console.warn('⚠️ Could not configure database timezone:', error);
  }
}

// Configure timezone on startup
configureDatabaseTimezone();

/**
 * Ensures database timezone is set to Central America Time
 * Call this before important operations to guarantee correct timezone
 */
export async function ensureCentralAmericaTimezone(): Promise<void> {
  try {
    await prisma.$executeRaw`SET timezone = 'America/Guatemala'`;
  } catch (error) {
    console.warn('⚠️ Could not set database timezone:', error);
  }
}

/**
 * Export the configured Prisma client as the default export.
 *
 * @remarks
 * Consumers of this module should import the same instance
 * to take advantage of automatic connection reuse.
 */
export default prisma;
