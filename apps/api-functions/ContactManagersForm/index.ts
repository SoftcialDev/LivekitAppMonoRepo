import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { z } from "zod";

import { withAuth }           from "../shared/middleware/auth";
import { withErrorHandler }   from "../shared/middleware/errorHandler";
import { withBodyValidation } from "../shared/middleware/validate";
import { ok, badRequest }     from "../shared/utils/response";
import prisma                  from "../shared/services/prismaClienService";
import { blobService }         from "../shared/services/blobStorageService";
import { contactManagersGroupService } from "../shared/services/contactManagersGroupService";


/**
 * Zod schemas for each form type, discriminated by formType.
 */
const DisconnectionsSchema = z.object({
  formType: z.literal("Disconnections"),
  rnName: z.string().min(1),
  patientInitials: z.string().min(1),
  timeOfDisconnection: z.string().min(1),
  reason: z.string().min(1),
  hospital: z.string().min(1),
  totalPatients: z.number().int().nonnegative(),
  imageBase64: z.string().optional(),
});

const AdmissionsSchema = z.object({
  formType: z.literal("Admissions"),
  facility: z.string().min(1),
  unit: z.string().min(1),
  imageBase64: z.string().optional(),
});

const AssistanceSchema = z.object({
  formType: z.literal("Assistance"),
  facility: z.string().min(1),
  patientInitials: z.string().min(1),
  totalPatientsInPod: z.number().int().nonnegative(),
  imageBase64: z.string().optional(),
});

const FormSchema = z.discriminatedUnion("formType", [
  DisconnectionsSchema,
  AdmissionsSchema,
  AssistanceSchema,
]);

/**
 * HTTP-triggered function to receive a Contact Managers form,
 * store it in the DB, sync the group chat, and post a rich message.
 */
const contactManagersFormFunction: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      // 1) Extract caller’s Azure AD OID from token claims
      const claims = (ctx as any).bindings.user as { oid?: string; sub?: string; fullName: string };
      const oid = claims.oid || claims.sub;
      if (!oid) return badRequest(ctx, "Missing OID in token");

      // 2) Look up sender in our database
      const sender = await prisma.user.findUnique({ where: { azureAdObjectId: oid } });
      if (!sender) return badRequest(ctx, "User not found");

      // 3) Validate request body against our union schema
      await withBodyValidation(FormSchema)(ctx, async () => {
        const body = ctx.bindings.validatedBody as z.infer<typeof FormSchema>;

        // 4) If an image was provided, upload to Blob Storage
        let imageUrl: string | null = null;
        if (body.imageBase64) {
          const buffer = Buffer.from(body.imageBase64, "base64");
          const path = `${new Date().toISOString().slice(0, 10)}/${sender.id}-${Date.now()}.jpg`;
          imageUrl = await blobService.uploadSnapshot(buffer, path);
        }

        // 5) Strip out imageBase64 and formType for JSON storage
        const data = { ...body };
        delete (data as any).imageBase64;
        delete (data as any).formType;

        // 6) Persist form record
        const record = await prisma.contactManagerForm.create({
          data: {
            formType: body.formType,
            senderId: sender.id,
            imageUrl: imageUrl ?? undefined,
            data,
          },
        });

        // 7) Sync (or create) the Contact Managers group chat
        const token  = (req.headers.authorization || "").split(" ")[1];
        const chatId = await contactManagersGroupService.getOrSyncChat(token);

        // 8) Build a dynamic subject based on formType
        const subjectMap: Record<string,string> = {
          Disconnections: "🚨 Disconnections Report",
          Admissions:     "🏥 Admissions Report",
          Assistance:     "⚕️ Acute Assessment Report",
        };
        const subject = subjectMap[body.formType];

        // 9) Post the rich message into Teams
        await contactManagersGroupService.sendMessage(token, chatId, {
          subject,
          senderName: sender.fullName,
          formType:   body.formType,
          data,
          imageUrl:   imageUrl ?? undefined,
        });

        // 10) Return the new record ID
        return ok(ctx, { formId: record.id });
      });
    });
  },
  {
    genericMessage: "Internal error processing contact manager form",
    showStackInDev: true,
  }
);

export default contactManagersFormFunction;
