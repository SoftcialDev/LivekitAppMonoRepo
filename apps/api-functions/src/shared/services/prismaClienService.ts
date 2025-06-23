/**
 * Singleton PrismaClient instance for database access.
 *
 * Using a single shared client throughout the application helps
 * manage connection pooling and prevents opening too many connections,
 * especially in serverless or development environments.
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/connection-management
 */
import { PrismaClient } from "@prisma/client";

/**
 * The PrismaClient provides methods to perform CRUD operations
 * and run raw SQL queries against the configured database.
 *
 * @example
 * import prisma from "./prisma";
 * const allUsers = await prisma.user.findMany();
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
