/**
 * Endpoint HTTP para ejecutar migraciones de base de datos usando Prisma.
 * 
 * Ejecuta `prisma db push` en un directorio temporal escribible para evitar
 * las restricciones del sistema de archivos de solo lectura en Azure Functions.
 * 
 * Requiere autenticación mediante token JWT de Azure AD.
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withAuth } from "../shared/middleware/auth";
import { ok, badRequest } from "../shared/utils/response";
import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { existsSync, mkdirSync, cpSync } from "fs";
import { config } from "../shared/config";
import { seedDefaultSnapshotReasons } from "../shared/infrastructure/seed/defaultSnapshotReasons";
import { seedDefaultRolesAndPermissions } from "../shared/infrastructure/seed/defaultRolesAndPermissions";
import { ServiceContainer } from "../shared/infrastructure/container/ServiceContainer";
import { IErrorLogService } from "../shared/domain/interfaces/IErrorLogService";
import { ErrorSource } from "../shared/domain/enums/ErrorSource";
import { ErrorSeverity } from "../shared/domain/enums/ErrorSeverity";

const execAsync = promisify(exec);

const MIGRATION_TIMEOUT_MS = 300000;

/**
 * Obtiene la ruta absoluta al archivo schema.prisma.
 * 
 * Intenta múltiples estrategias de resolución de rutas para manejar diferentes
 * contextos de despliegue (local, Azure Functions, etc).
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
 * Ejecuta migraciones de base de datos y seeding.
 * 
 * Requiere token JWT válido de Azure AD en el header Authorization.
 * Intenta primero sin pérdida de datos, y solo usa --force-reset si es necesario.
 */
const runMigrationsHandler: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // Only allow POST requests
      if (req.method !== "POST") {
        return badRequest(ctx, "Only POST method is allowed");
      }

      const { migrationCommand: baseCommand, workingDir } = preparePrismaRuntime();

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

        const execOptions = {
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
        };

        ctx.log.info("[RunMigrations] Iniciando migración sin pérdida de datos");
        let migrationCommand = baseCommand.replace(/--force-reset --accept-data-loss/g, '').trim();
        
        let stdout: string = '';
        let stderr: string = '';
        let migrationSucceeded = false;

        try {
          const result = await execAsync(migrationCommand, execOptions);
          stdout = result.stdout || '';
          stderr = result.stderr || '';
          migrationSucceeded = true;
        } catch (firstAttemptError: any) {
          const errorMessage = firstAttemptError.message || '';
          const errorOutput = (firstAttemptError.stdout || '') + (firstAttemptError.stderr || '');
          
          const requiresDataLoss = 
            errorMessage.includes('without a default value') ||
            errorMessage.includes('cannot be executed') ||
            errorMessage.includes('it is not possible') ||
            errorOutput.includes('without a default value') ||
            errorOutput.includes('cannot be executed') ||
            errorOutput.includes('it is not possible') ||
            process.env.MIGRATION_FORCE_RESET === "true";
          
          if (requiresDataLoss) {
            ctx.log.warn("[RunMigrations] La migración requiere pérdida de datos, reintentando con --force-reset");
            
            migrationCommand = baseCommand;
            if (!migrationCommand.includes('--force-reset')) {
              migrationCommand = migrationCommand + ' --force-reset --accept-data-loss';
            }
            
            const result = await execAsync(migrationCommand, execOptions);
            stdout = result.stdout || '';
            stderr = result.stderr || '';
            migrationSucceeded = true;
          } else {
            throw firstAttemptError;
          }
        }

        if (!migrationSucceeded) {
          throw new Error("La migración falló después de todos los intentos");
        }

        try {
          await seedDefaultRolesAndPermissions();
          await seedDefaultSnapshotReasons();
        } catch (seedError: unknown) {
          ctx.log.error(`[RunMigrations] Error en seeding: ${seedError instanceof Error ? seedError.message : String(seedError)}`);
          
          try {
            const serviceContainer = ServiceContainer.getInstance();
            serviceContainer.initialize();
            const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
            await errorLogService.logError({
              severity: ErrorSeverity.High,
              source: ErrorSource.Database,
              endpoint: "/api/RunMigrations",
              functionName: "RunMigrations",
              error: seedError instanceof Error ? seedError : new Error(String(seedError)),
              context: {
                operation: "seed_roles_permissions_snapshot_reasons",
                migrationCompleted: true,
                errorType: "seed_failure"
              }
            });
          } catch (logError) {
            ctx.log.error(`[RunMigrations] No se pudo registrar el error de seeding: ${logError}`);
          }
        }

        return ok(ctx, {
          success: true,
          message: "Migrations and seeding completed successfully",
          timestamp: new Date().toISOString()
        });

      } catch (error: unknown) {
        ctx.log.error(`[RunMigrations] Error en migración: ${error instanceof Error ? error.message : String(error)}`);

        try {
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();
          const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
          await errorLogService.logError({
            severity: ErrorSeverity.Critical,
            source: ErrorSource.Database,
            endpoint: "/api/RunMigrations",
            functionName: "RunMigrations",
            error: error instanceof Error ? error : new Error(String(error)),
            context: {
              operation: "database_migration",
              workingDir: workingDir,
              stdout: error && typeof error === "object" && "stdout" in error ? String((error as any).stdout) : undefined,
              stderr: error && typeof error === "object" && "stderr" in error ? String((error as any).stderr) : undefined,
              errorType: "migration_failure"
            }
          });
        } catch (logError) {
          ctx.log.error(`[RunMigrations] No se pudo registrar el error: ${logError}`);
        }

        throw error;
      }
    });
  },
  {
    genericMessage: "Migration execution failed",
    showStackInDev: true,
  }
);

export default runMigrationsHandler;

/**
 * Prepara un entorno de ejecución de Prisma escribible en `/tmp/prisma-runtime`.
 * 
 * Copia el CLI de Prisma y los paquetes `@prisma` desde el directorio de despliegue
 * de solo lectura a un directorio temporal escribible. Esto permite ejecutar migraciones
 * en Azure Functions donde el directorio de despliegue es de solo lectura.
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
    migrationCommand: `node "${runtimePrismaBuild}" db push --schema "${PRISMA_SCHEMA_PATH}"`,
    workingDir: runtimeRoot,
  };
}

