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
 * Export the configured Prisma client as the default export.
 *
 * @remarks
 * Consumers of this module should import the same instance
 * to take advantage of automatic connection reuse.
 */
export default prisma;
