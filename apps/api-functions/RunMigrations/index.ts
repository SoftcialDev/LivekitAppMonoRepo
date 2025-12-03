/**
 * @fileoverview Timer-triggered Azure Function for executing Prisma database schema synchronization.
 * 
 * This function runs Prisma schema synchronization using `prisma db push` in a writable
 * temporary directory to work around Azure Functions' read-only file system restrictions.
 * Configured via function.json to execute on schedule (daily at midnight UTC) and
 * automatically on Function App startup/deployment.
 */

import { Context, Timer } from "@azure/functions";
import { exec } from "child_process";
import { promisify } from "util";
import { join, dirname } from "path";
import { existsSync, mkdirSync, cpSync } from "fs";
import { config } from "../shared/config";

const execAsync = promisify(exec);

const MIGRATION_TIMEOUT_MS = 300000;

/**
 * Resolves the absolute path to the Prisma schema file.
 * 
 * Attempts multiple path resolution strategies to handle different deployment contexts.
 * 
 * @returns Absolute path to schema.prisma file.
 * @throws {Error} If schema file cannot be located after all resolution attempts.
 */
function getPrismaSchemaPath(): string {
  const currentDir = __dirname;
  
  const possiblePaths = [
    join(currentDir, "..", "prisma", "schema.prisma"),
    join(currentDir, "prisma", "schema.prisma"),
    join(process.cwd(), "prisma", "schema.prisma"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return join(currentDir, "..", "prisma", "schema.prisma");
}

const PRISMA_SCHEMA_PATH = getPrismaSchemaPath();

/**
 * Executes Prisma database schema synchronization using the Prisma CLI.
 * 
 * This function stages Prisma runtime files in a writable `/tmp` directory because
 * Azure Functions deployment directories are read-only. It copies the Prisma CLI and
 * engines to `/tmp/prisma-runtime` and executes `db push` to synchronize the schema.
 * 
 * @param ctx - Azure Functions execution context for logging.
 * @param PrismaMigrationTrigger - Timer trigger binding.
 * @throws {Error} If schema synchronization command execution fails or times out.
 */
export default async function runMigrations(
  ctx: Context,
  PrismaMigrationTrigger: Timer
): Promise<void> {
  const { migrationCommand, workingDir } = preparePrismaRuntime();

  try {
    const prismaEnginesDir = "/tmp/prisma-engines";
    
    if (!existsSync(prismaEnginesDir)) {
      mkdirSync(prismaEnginesDir, { recursive: true });
    }
    
    const packagedEnginesDir = join(process.cwd(), "node_modules", "@prisma", "engines");
    if (existsSync(packagedEnginesDir)) {
      cpSync(packagedEnginesDir, prismaEnginesDir, { recursive: true });
    }
    
    process.env.PRISMA_ENGINES_TARGET_DIR = prismaEnginesDir;
    process.env.PRISMA_CLI_ALLOW_ENGINE_DOWNLOAD = "1";
    process.env.PRISMA_GENERATE_SKIP_AUTOINSTALL = "1";

    const { stdout, stderr } = await execAsync(migrationCommand, {
      cwd: workingDir,
      env: {
        ...process.env,
        DATABASE_URL: config.databaseUrl,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        NODE_PATH: [
          join(workingDir, "node_modules"),
          join(process.cwd(), "node_modules")
        ].join(":"),
        PRISMA_ENGINES_TARGET_DIR: prismaEnginesDir,
      },
      timeout: MIGRATION_TIMEOUT_MS,
    });

    if (stdout) {
      ctx.log.info(`[RunMigrations] ${stdout}`);
    }
    if (stderr) {
      ctx.log.warn(`[RunMigrations] ${stderr}`);
    }
  } catch (error: unknown) {
    ctx.log.error(`[RunMigrations] Command failed: ${migrationCommand}`);
    
    if (error instanceof Error) {
      ctx.log.error(`[RunMigrations] ${error.message}`);
      ctx.log.error(`[RunMigrations] Stack: ${error.stack}`);
    } else {
      ctx.log.error(`[RunMigrations] ${String(error)}`);
    }

    if (error && typeof error === "object" && "stdout" in error) {
      ctx.log.error(`[RunMigrations] stdout: ${String((error as any).stdout)}`);
    }
    if (error && typeof error === "object" && "stderr" in error) {
      ctx.log.error(`[RunMigrations] stderr: ${String((error as any).stderr)}`);
    }

    throw error;
  }
}

/**
 * Prepares a writable Prisma runtime environment in `/tmp/prisma-runtime`.
 * 
 * Copies the Prisma CLI and `@prisma` packages from the read-only deployment
 * directory to a writable temporary directory. This allows Prisma to execute
 * migrations in Azure Functions where the deployment directory is read-only.
 * 
 * @returns Object containing the migration command and working directory path.
 */
function preparePrismaRuntime(): { migrationCommand: string; workingDir: string } {
  const runtimeRoot = "/tmp/prisma-runtime";
  const runtimeNodeModules = join(runtimeRoot, "node_modules");
  const runtimePrismaDir = join(runtimeNodeModules, "prisma");
  const runtimeVendorDir = join(runtimeNodeModules, "@prisma");
  const runtimePrismaBuild = join(runtimePrismaDir, "build", "index.js");

  const sourceNodeModules = join(process.cwd(), "node_modules");
  const sourcePrismaDir = join(sourceNodeModules, "prisma");
  const sourceVendorDir = join(sourceNodeModules, "@prisma");

  if (!existsSync(runtimeRoot)) {
    mkdirSync(runtimeRoot, { recursive: true });
  }

  if (!existsSync(runtimeNodeModules)) {
    mkdirSync(runtimeNodeModules, { recursive: true });
  }

  if (!existsSync(runtimePrismaDir)) {
    mkdirSync(runtimePrismaDir, { recursive: true });
    cpSync(sourcePrismaDir, runtimePrismaDir, { recursive: true });
  }

  if (!existsSync(runtimeVendorDir)) {
    mkdirSync(runtimeVendorDir, { recursive: true });
    cpSync(sourceVendorDir, runtimeVendorDir, { recursive: true });
  }

  return {
    migrationCommand: `node "${runtimePrismaBuild}" db push --schema "${PRISMA_SCHEMA_PATH}" --accept-data-loss`,
    workingDir: runtimeRoot,
  };
}

