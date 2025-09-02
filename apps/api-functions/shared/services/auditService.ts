import { Prisma, AuditLog } from "@prisma/client";
import prisma from "./prismaClienService";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ROLE_CHANGE"
  | "STREAM_START"
  | "STREAM_STOP";

export interface AuditEntry<T = any> {
  entity: string;
  entityId: string;
  action: AuditAction;
  changedById: string;
  dataBefore?: T | null;
  dataAfter?: T | null;
}

export async function logAudit<T = any>(entry: AuditEntry<T>): Promise<void> {
  // build the `data` object and only include JSON fields if not null
  const data: Prisma.AuditLogCreateInput = {
    entity:      entry.entity,
    entityId:    entry.entityId,
    action:      entry.action,
    changedBy: { connect: { id: entry.changedById } },
    ...(entry.dataBefore !== undefined
      ? { dataBefore: entry.dataBefore === null ? Prisma.JsonNull : entry.dataBefore }
      : {}),
    ...(entry.dataAfter !== undefined
      ? { dataAfter: entry.dataAfter === null ? Prisma.JsonNull : entry.dataAfter }
      : {}),
  };

  await prisma.auditLog.create({ data });
}
