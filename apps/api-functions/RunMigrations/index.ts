/**
 * @fileoverview RunMigrations - Timer-triggered function to execute Prisma database migrations
 * @description Automatically runs database migrations when the Function App starts or on schedule
 */

import { Context, Timer } from "@azure/functions";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "../shared/config";

const execAsync = promisify(exec);

const MIGRATION_TIMEOUT_MS = 300000;
const MIGRATION_COMMAND = "npx prisma migrate deploy";

/**
 * Executes Prisma database migrations
 * 
 * @param ctx - Azure Functions execution context
 * @param PrismaMigrationTrigger - Timer trigger binding
 */
export default async function runMigrations(
  ctx: Context,
  PrismaMigrationTrigger: Timer
): Promise<void> {
  try {
    const { stdout, stderr } = await execAsync(MIGRATION_COMMAND, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl,
      },
      timeout: MIGRATION_TIMEOUT_MS,
    });

    if (stderr) {
      ctx.log.warn(`[RunMigrations] ${stderr}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      ctx.log.error(`[RunMigrations] ${error.message}`);
    } else {
      ctx.log.error(`[RunMigrations] ${String(error)}`);
    }

    if (error && typeof error === "object" && "stdout" in error) {
      ctx.log.error(`[RunMigrations] ${String((error as any).stdout)}`);
    }
    if (error && typeof error === "object" && "stderr" in error) {
      ctx.log.error(`[RunMigrations] ${String((error as any).stderr)}`);
    }
  }
}

