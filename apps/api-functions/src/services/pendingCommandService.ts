import prisma from "./prismaClienService";
import { sendToGroup } from "./webPubSubService";
import { getPresenceStatus } from "./presenceService";

/**
 * createPendingCommand
 *
 * Persists a command START/STOP for an employee.
 *
 * @param employeeEmail — Email of the employee.
 * @param command       — "START" or "STOP".
 * @param timestamp     — ISO string or Date; if string, se convierte a Date.
 * @returns Promise<PendingCommand> — El registro creado.
 */
export async function createPendingCommand(
  employeeEmail: string,
  command: "START" | "STOP",
  timestamp: string | Date
) {
  const ts = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return await prisma.pendingCommand.create({
    data: {
      employeeEmail,
      command,
      timestamp: ts,
      delivered: false
    }
  });
}

/**
 * tryDeliverCommand
 *
 * Intenta entregar el comando de inmediato si el usuario está online:
 *  - Consulta presencia (via presenceService).
 *  - Si online: envía vía Web PubSub y marca como delivered.
 *  - Si offline: no envía y deja delivered=false.
 *
 * @param pendingCmd — Registro de PendingCommand (de Prisma) o al menos su id y employeeEmail.
 * @returns Promise<boolean> — true si se entregó ahora, false si quedó pendiente.
 */
export async function tryDeliverCommand(pendingCmd: {
  id: string;
  employeeEmail: string;
  command: string;
  timestamp: Date;
}): Promise<boolean> {
  const status = await getPresenceStatus(pendingCmd.employeeEmail);
  if (status === "online") {
    // enviar notificación
    await sendToGroup(pendingCmd.employeeEmail, {
      command: pendingCmd.command,
      timestamp: pendingCmd.timestamp.toISOString()
    });
    // marcar delivered
    await prisma.pendingCommand.update({
      where: { id: pendingCmd.id },
      data: { delivered: true }
    });
    return true;
  }
  // usuario offline, no entregado aún
  return false;
}

/**
 * getPendingCommandsForEmployee
 *
 * Recupera todos los comandos pendientes (delivered = false) para un empleado.
 *
 * @param employeeEmail — Email del empleado.
 * @returns Promise<PendingCommand[]> — Lista de comandos pendientes, ordenados por timestamp ascendente.
 */
export async function getPendingCommandsForEmployee(
  employeeEmail: string
) {
  return await prisma.pendingCommand.findMany({
    where: {
      employeeEmail,
      delivered: false
    },
    orderBy: {
      timestamp: "asc"
    }
  });
}

/**
 * markCommandsDelivered
 *
 * Marca como entregados (delivered = true) una lista de IDs de comandos.
 *
 * @param ids — Array de IDs de PendingCommand.
 * @returns Promise<number> — Número de registros actualizados.
 */
export async function markCommandsDelivered(ids: string[]): Promise<number> {
  const resp = await prisma.pendingCommand.updateMany({
    where: {
      id: { in: ids }
    },
    data: { delivered: true }
  });
  return resp.count;
}
