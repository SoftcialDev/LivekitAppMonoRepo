// src/functions/LiveKitTokenFunction.ts

import { Context, HttpRequest } from '@azure/functions';
import { withAuth } from '../shared/middleware/auth';
import { withErrorHandler } from '../shared/middleware/errorHandler';
import { ok, badRequest, unauthorized } from '../shared/utils/response';
import {
  listRooms,
  ensureRoom,
  generateToken,
} from '../shared/services/livekitService';
import prisma from '../shared/services/prismaClienService';
import { JwtPayload } from 'jsonwebtoken';

/**
 * LiveKitTokenFunction
 *
 * - Si llamas como Admin o Supervisor, devuelve:
 *    • rooms: lista de salas permitidas
 *    • accessToken: tu token con roomAdmin=true
 *    • employeeToken: token para el empleado scerdasb@ucenfotec.ac.cr
 *    • employeeRoom: nombre de la sala de ese empleado
 *
 * - Si llamas como Employee, solo te devuelve tu sala y tu token.
 */
export default withErrorHandler(async (ctx: Context) => {
  const req = ctx.req!;
  await withAuth(ctx, async () => {
    const claims    = (ctx as any).bindings.user as JwtPayload;
    const azureAdId = (claims.oid || claims.sub) as string;
    if (!azureAdId) {
      return badRequest(ctx, 'Unable to determine caller identity');
    }

    const caller = await prisma.user.findUnique({
      where: { azureAdObjectId: azureAdId },
    });
    if (!caller || caller.deletedAt) {
      return unauthorized(ctx, 'Caller not found or deleted');
    }

    const isAdminOrSup = caller.role === 'Admin' || caller.role === 'Supervisor';
    let rooms: string[];
    let accessToken: string;

    if (isAdminOrSup) {
      // 1) Filtrar salas según rol
      const allRooms = await listRooms();
      if (caller.role === 'Supervisor') {
        const reports = await prisma.user.findMany({
          where: {
            supervisorId: caller.id,
            deletedAt:    null,
            role:         'Employee',
          },
          select: { email: true },
        });
        const allowed = new Set(reports.map(r => r.email.toLowerCase()));
        rooms = allRooms.filter(r => allowed.has(r.toLowerCase()));
      } else {
        rooms = allRooms;
      }

      // 2) Token del Admin/Supervisor
      accessToken = await generateToken(azureAdId, true);

      // 3) Además, generar token para scerdasb@ucenfotec.ac.cr
      const employeeEmail = 'scerdasb@ucenfotec.ac.cr';
      const employee = await prisma.user.findUnique({
        where: { email: employeeEmail },
      });
      if (!employee || employee.deletedAt) {
        return badRequest(ctx, `Employee ${employeeEmail} not found`);
      }
      const employeeRoom = employee.azureAdObjectId;
      // Asegurarnos de que existe la sala del empleado
      await ensureRoom(employeeRoom);
      const employeeToken = await generateToken(
        employee.azureAdObjectId,
        false,
        employeeRoom
      );

      return ok(ctx, {
        rooms,
        accessToken,
        employeeRoom,
        employeeToken,
      });

    } else {
      // Employee normal: solo su propia sala
      const roomName    = azureAdId;
      await ensureRoom(roomName);
      accessToken = await generateToken(azureAdId, false, roomName);
      rooms       = [roomName];

      return ok(ctx, {
        rooms,
        accessToken,
      });
    }
  });
});
