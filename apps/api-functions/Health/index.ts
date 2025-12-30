/**
 * @fileoverview HealthFunction
 * @description Health check endpoint para validar variables de entorno y opcionalmente
 * hacer un test de conectividad a la base de datos. Este endpoint se mantiene independiente
 * de otros módulos para evitar fallos en tiempo de importación cuando faltan variables de entorno.
 */

import type { Context } from "@azure/functions";
import { PrismaClient } from "@prisma/client";

type HealthStatus = "ok" | "fail";

type DatabaseCheck = {
  status: HealthStatus;
  message: string;
  details?: unknown;
};

type EnvCheck = {
  status: HealthStatus;
  missingKeys: string[];
  presentKeys?: string[];
};

type HealthPayload = {
  status: HealthStatus;
  timestamp: string;
  checks: {
    env: EnvCheck;
    database?: DatabaseCheck;
  };
  users?: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    azureAdObjectId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }> | { error: string };
};

/**
 * Health check endpoint
 * 
 * GET /api/health
 * 
 * Query params:
 * - verbose=true: muestra detalles adicionales de diagnóstico (sin valores sensibles)
 * - db=false: omite el test de conectividad a la base de datos
 * - users=true: incluye todos los usuarios de la base de datos en la respuesta
 * 
 * Respuestas:
 * - 200: todos los checks pasaron
 * - 503: uno o más checks fallaron
 */
export default async function HealthFunction(ctx: Context): Promise<void> {
  const timestamp = new Date().toISOString();

  const requiredEnvKeys = [
    "DATABASE_URL",
    "LIVEKIT_API_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "SERVICE_BUS_CONNECTION",
    "WEBPUBSUB_ENDPOINT",
    "WEBPUBSUB_KEY",
    "WEBPUBSUB_NAME",
    "AZURE_TENANT_ID",
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "SERVICE_BUS_TOPIC_NAME",
    "NODE_ENV",
    "ADMINS_GROUP_ID",
    "SUPERVISORS_GROUP_ID",
    "EMPLOYEES_GROUP_ID",
    "AZURE_AD_API_IDENTIFIER_URI",
    "SERVICE_PRINCIPAL_OBJECT_ID",
    "CONTACT_MANAGER_GROUP_ID",
    "COMMANDS_SUBSCRIPTION_NAME",
    "AZURE_STORAGE_ACCOUNT",
    "AZURE_STORAGE_KEY",
    "SUPER_ADMIN_GROUP_ID"
  ] as const;

  const req = (ctx as any).req ?? {};
  const query = (req.query ?? {}) as Record<string, unknown>;

  const verbose = String(query.verbose ?? "").toLowerCase() === "true";
  const dbEnabled = String(query.db ?? "true").toLowerCase() !== "false";
  const includeUsers = String(query.users ?? "").toLowerCase() === "true";

  const missingKeys = requiredEnvKeys.filter((k) => {
    const val = process.env[k];
    return !val || String(val).trim().length === 0;
  });

  const envCheck: EnvCheck = {
    status: missingKeys.length === 0 ? "ok" : "fail",
    missingKeys
  };

  if (verbose) {
    envCheck.presentKeys = requiredEnvKeys.filter((k) => {
      const val = process.env[k];
      return !!val && String(val).trim().length > 0;
    });
  }

  const payload: HealthPayload = {
    status: "ok",
    timestamp,
    checks: {
      env: envCheck
    }
  };

  if (dbEnabled) {
    const dbUrl = process.env.DATABASE_URL;
    payload.checks.database = dbUrl
      ? await runDatabaseCheck(dbUrl, verbose)
      : {
          status: "fail",
          message: "DATABASE_URL is missing; database connectivity was not tested."
        };
  }

  if (includeUsers) {
    try {
      const dbUrl = process.env.DATABASE_URL;

      if (!dbUrl) {
        payload.users = {
          error: "DATABASE_URL is missing"
        };
      } else {
        const prisma = new PrismaClient({
          datasources: { db: { url: dbUrl } }
        });

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
          payload.users = users;
        } finally {
          await prisma.$disconnect().catch(() => undefined);
        }
      }
    } catch (err: any) {
      payload.users = {
        error: err?.message ?? String(err)
      };
    }
  }

  const overallOk =
    payload.checks.env.status === "ok" &&
    (!payload.checks.database || payload.checks.database.status === "ok");

  payload.status = overallOk ? "ok" : "fail";

  ctx.res = {
    status: overallOk ? 200 : 503,
    headers: { "content-type": "application/json" },
    body: payload
  };
}

/**
 * Prueba la conectividad a la base de datos ejecutando un SELECT 1 simple.
 * 
 * @param databaseUrl - Connection string de la base de datos
 * @param verbose - Si es true, incluye detalles del error (nombre, mensaje, stack) en la respuesta
 * @returns Resultado del check de base de datos
 */
async function runDatabaseCheck(databaseUrl: string, verbose: boolean): Promise<DatabaseCheck> {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } }
    });

    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", message: "Database connectivity OK (SELECT 1 succeeded)." };
    } finally {
      await prisma.$disconnect().catch(() => undefined);
    }
  } catch (err: any) {
    return {
      status: "fail",
      message: "Database connectivity failed.",
      details: verbose
        ? { name: err?.name, message: err?.message, stack: err?.stack }
        : { message: err?.message ?? String(err) }
    };
  }
}
