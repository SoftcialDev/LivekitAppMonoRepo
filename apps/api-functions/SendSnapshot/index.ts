import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { randomUUID } from "crypto";
import { z } from "zod";

import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest } from "../shared/utils/response";

import { blobService } from "../shared/services/blobStorageService";
import prisma from "../shared/services/prismaClienService";
import { adminChatService } from "../shared/services/adminChatService";

/**
 * Zod schema for validating incoming snapshot report payload.
 */
const SnapshotSchema = z.object({
  /** 
   * The PSO’s email address (case‑insensitive), used to look up the PSO user record. 
   */
  psoEmail:    z.string().email(),
  /** Text reason or details provided by the supervisor. */
  reason:      z.string().min(1),
  /** Base64‑encoded JPEG snapshot image. */
  imageBase64: z.string().min(1),
});

/**
 * HTTP-triggered Azure Function to process a supervisor’s snapshot report.
 *
 * @remarks
 * This function:
 * 1. Authenticates the caller and verifies they are a Supervisor.
 * 2. Validates the request body against {@link SnapshotSchema}.
 * 3. Looks up the PSO user by their email address.
 * 4. Decodes the Base64 image and uploads it via {@link blobService}.
 * 5. Persists snapshot metadata (supervisorId, psoId, reason, imageUrl) in PostgreSQL.
 * 6. Retrieves or synchronizes the Administrators chat via {@link adminChatService.getOrSyncChat}.
 * 7. Sends a formatted report message to that chat via {@link adminChatService.sendMessage}.
 *
 * @param ctx - The Azure Functions execution context, with auth claims in `ctx.bindings.user`.
 * @param req - The incoming HTTP request containing JSON matching {@link SnapshotSchema}.
 * @returns A 200 OK response with the new `snapshotId`, or a 400 error if validation or lookup fails.
 */
const snapshotFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Extract supervisor’s OID from token claims
      const claims = (ctx as any).bindings.user as {
        oid?: string;
        sub?: string;
        fullName: string;
      };
      const oid = claims.oid || claims.sub;
      if (!oid) {
        return badRequest(ctx, "Missing OID in token");
      }

      // 2) Verify supervisor exists
      const supervisor = await prisma.user.findUnique({
        where: { azureAdObjectId: oid },
      });
      if (!supervisor) {
        return badRequest(ctx, "Supervisor not found");
      }

      // 3) Validate payload
      await withBodyValidation(SnapshotSchema)(ctx, async () => {
        const { psoEmail, reason, imageBase64 } =
          ctx.bindings.validatedBody as z.infer<typeof SnapshotSchema>;

        // 4) Lookup PSO by email
        const pso = await prisma.user.findUnique({
          where: { email: psoEmail.toLowerCase() },
        });
        if (!pso) {
          return badRequest(ctx, "PSO user not found");
        }

        // 5) Decode and upload image
        const buffer = Buffer.from(imageBase64, "base64");
        const datePath = new Date().toISOString().slice(0, 10);
        const filename = `${datePath}/${randomUUID()}.jpg`;
        const imageUrl = await blobService.uploadSnapshot(buffer, filename);

        // 6) Persist snapshot record
        const snap = await prisma.snapshot.create({
          data: {
            supervisorId: supervisor.id,
            psoId:        pso.id,
            reason,
            imageUrl,
          },
        });

        // 7) Notify Admins via Teams chat
        const token  = (req.headers.authorization || "").split(" ")[1];
        const chatId = await adminChatService.getOrSyncChat(token);
        await adminChatService.sendMessage(token, chatId, {
          subject:        "📸 New Snapshot Report",
          supervisorName: supervisor.fullName,
          psoEmail:          pso.email,
          reason,
          imageBase64,
        });

        // 8) Return success
        return ok(ctx, { snapshotId: snap.id });
      });
    });
  },
  {
    genericMessage: "Internal error processing snapshot",
    showStackInDev: true,
  }
);

export default snapshotFunction;
