import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { withAuth } from "../shared/middleware/auth";
import { ok, badRequest } from "../shared/utils/response";
import { GraphService } from "../shared/infrastructure/services/GraphService";
import prisma from "../shared/infrastructure/database/PrismaClientService";
import { getCentralAmericaTime } from "../shared/utils/dateUtils";


function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function generateFullNameFromEmail(email: string): string {
  const namePart = email.split('@')[0];
  const cleanName = namePart.replace(/[._]/g, ' ');
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function processDisplayName(displayName: string | undefined, email: string): string {
  if (!displayName || displayName === email) {
    return generateFullNameFromEmail(email);
  }
  return displayName;
}



async function syncTenantUsersHandler(ctx: Context, req: HttpRequest): Promise<void> {
  await withAuth(ctx, async () => {
    if (req.method !== "POST") {
      return badRequest(ctx, "Only POST method is allowed");
    }

    ctx.log.info("[SyncTenantUsers] Starting tenant users synchronization");

    try {
      await prisma.$executeRaw`SET timezone = 'America/Guatemala'`;
      ctx.log.info("[SyncTenantUsers] Database timezone configured to Central America");

      const graphService = new GraphService();
      const token = await graphService.getGraphToken();
      ctx.log.info("[SyncTenantUsers] Graph token acquired");

      const graphUsers = await graphService.fetchAllUsers(token);
      ctx.log.info(`[SyncTenantUsers] Fetched ${graphUsers.length} users from Graph API`);

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const graphUser of graphUsers) {
        try {
          if (graphUser.accountEnabled === false) {
            skippedCount++;
            continue;
          }

          const email = graphUser.mail ?? graphUser.userPrincipalName;
          if (!email) {
            skippedCount++;
            continue;
          }

          const normalizedEmail = normalizeEmail(email);
          const processedDisplayName = processDisplayName(graphUser.displayName, normalizedEmail);

          const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
          });

          if (existingUser) {
            if (existingUser.fullName !== processedDisplayName) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  fullName: processedDisplayName,
                  updatedAt: getCentralAmericaTime()
                }
              });
              updatedCount++;
              ctx.log.info(`[SyncTenantUsers] Updated user: ${normalizedEmail}`);
            }
          } else {
            await prisma.user.create({
              data: {
                azureAdObjectId: graphUser.id,
                email: normalizedEmail,
                fullName: processedDisplayName,
                role: 'Unassigned',
                createdAt: getCentralAmericaTime(),
                updatedAt: getCentralAmericaTime()
              }
            });
            createdCount++;
            ctx.log.info(`[SyncTenantUsers] Created user: ${normalizedEmail}`);
          }
        } catch (userError: any) {
          ctx.log.error(`[SyncTenantUsers] Error processing user ${graphUser.id}:`, userError);
          skippedCount++;
        }
      }

      ctx.log.info(`[SyncTenantUsers] Sync completed - Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);

      return ok(ctx, {
        success: true,
        message: "Tenant users synchronization completed",
        stats: {
          created: createdCount,
          updated: updatedCount,
          skipped: skippedCount,
          total: graphUsers.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      ctx.log.error("[SyncTenantUsers] Sync failed:", error);
      throw error;
    }
  });
}

const syncTenantUsers: AzureFunction = withErrorHandler(
  syncTenantUsersHandler,
  {
    genericMessage: "Internal Server Error in SyncTenantUsers",
    showStackInDev: true,
  }
);

export default syncTenantUsers;