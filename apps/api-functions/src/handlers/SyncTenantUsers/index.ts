import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withErrorHandler } from '../../middleware/errorHandler';
import { withAuth } from '../../middleware/auth';
import { ok, badRequest } from '../../utils/response';
import { GraphService } from '../../infrastructure/services/GraphService';
import prisma from '../../infrastructure/database/PrismaClientService';
import { getCentralAmericaTime } from '../../utils/dateUtils';
import { extractErrorMessage } from '../../utils/error/ErrorHelpers';


function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function generateFullNameFromEmail(email: string): string {
  const namePart = email.split('@')[0];
  const cleanName = namePart.replaceAll(/[._]/g, ' ');
  return cleanName
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function processDisplayName(displayName: string | undefined, email: string): string {
  if (!displayName || displayName === email) {
    return generateFullNameFromEmail(email);
  }
  return displayName;
}

/**
 * Checks if a graph user should be skipped
 * @param graphUser - Graph user to check
 * @returns True if user should be skipped
 */
function shouldSkipGraphUser(graphUser: { accountEnabled?: boolean; mail?: string; userPrincipalName?: string }): boolean {
  if (graphUser.accountEnabled === false) {
    return true;
  }

  const email = graphUser.mail ?? graphUser.userPrincipalName;
  return !email;
}

/**
 * Processes a single graph user (create or update)
 * @param graphUser - Graph user to process
 * @param normalizedEmail - Normalized email address
 * @param processedDisplayName - Processed display name
 * @returns Object with action performed ('created' | 'updated' | 'skipped')
 */
async function processGraphUser(
  graphUser: { id: string },
  normalizedEmail: string,
  processedDisplayName: string
): Promise<'created' | 'updated' | 'skipped'> {
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
      return 'updated';
    }
    return 'skipped';
  }

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
  return 'created';
}

/**
 * Processes all graph users and returns statistics
 * @param graphUsers - Array of graph users to process
 * @param ctx - Azure Functions context
 * @returns Object with counts of created, updated, and skipped users
 */
async function processAllGraphUsers(
  graphUsers: Array<{ id: string; mail?: string; userPrincipalName?: string; displayName?: string; accountEnabled?: boolean }>,
  ctx: Context
): Promise<{ createdCount: number; updatedCount: number; skippedCount: number }> {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const graphUser of graphUsers) {
    try {
      if (shouldSkipGraphUser(graphUser)) {
        skippedCount++;
        continue;
      }

      const email = graphUser.mail ?? graphUser.userPrincipalName;
      const normalizedEmail = normalizeEmail(email!);
      const processedDisplayName = processDisplayName(graphUser.displayName, normalizedEmail);

      const action = await processGraphUser(graphUser, normalizedEmail, processedDisplayName);
      
      if (action === 'created') {
        createdCount++;
        ctx.log.info(`[SyncTenantUsers] Created user: ${normalizedEmail}`);
      } else if (action === 'updated') {
        updatedCount++;
        ctx.log.info(`[SyncTenantUsers] Updated user: ${normalizedEmail}`);
      } else {
        skippedCount++;
      }
    } catch (userError: unknown) {
      const errorMessage = extractErrorMessage(userError);
      ctx.log.error(`[SyncTenantUsers] Error processing user ${graphUser.id}:`, userError instanceof Error ? userError : new Error(errorMessage));
      skippedCount++;
    }
  }

  return { createdCount, updatedCount, skippedCount };
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

      const { createdCount, updatedCount, skippedCount } = await processAllGraphUsers(graphUsers, ctx);

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

    } catch (error: unknown) {
      ctx.log.error("[SyncTenantUsers] Sync failed:", error instanceof Error ? error : new Error(String(error)));
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