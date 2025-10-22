/**
 * @fileoverview SyncTenantUsers - Timer-triggered function to sync tenant users with database
 * @description Runs every hour to sync Azure AD tenant users with local database
 */

import { AzureFunction, Context, Timer } from "@azure/functions";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { GraphService } from "../shared/infrastructure/services/GraphService";
import prisma from "../shared/infrastructure/database/PrismaClientService";
import { getCentralAmericaTime } from "../shared/utils/dateUtils";

/**
 * Graph user interface
 */
interface GraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
}

/**
 * Normalizes email to lowercase
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Generates full name from email if displayName is missing or equals email
 */
function generateFullNameFromEmail(email: string): string {
  // Extract name part before @
  const namePart = email.split('@')[0];
  
  // Replace dots and underscores with spaces
  const cleanName = namePart.replace(/[._]/g, ' ');
  
  // Capitalize first letter of each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Processes display name - uses it if valid, otherwise generates from email
 */
function processDisplayName(displayName: string | undefined, email: string): string {
  if (!displayName || displayName === email) {
    return generateFullNameFromEmail(email);
  }
  return displayName;
}

/**
 * Splits full name into first and last name
 */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" ") || "",
  };
}

/**
 * Syncs tenant users with database
 */
async function syncTenantUsersHandler(ctx: Context, myTimer: Timer): Promise<void> {
  ctx.log.info("[SyncTenantUsers] Starting tenant users synchronization");

  try {

    // Configure database timezone to Central America Time
    await prisma.$executeRaw`SET timezone = 'America/Guatemala'`;
    ctx.log.info("[SyncTenantUsers] Database timezone configured to Central America");

    // 1. Get Graph token
    const graphService = new GraphService();
    const token = await graphService.getGraphToken();
    ctx.log.info("[SyncTenantUsers] Graph token acquired");

    // 2. Fetch all users from Graph API
    const graphUsers = await graphService.fetchAllUsers(token);
    ctx.log.info(`[SyncTenantUsers] Fetched ${graphUsers.length} users from Graph API`);

    // 3. Process each user
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const graphUser of graphUsers) {
      try {
        // Skip disabled accounts
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
        const { firstName, lastName } = splitFullName(processedDisplayName);

        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        if (existingUser) {
          // Update existing user if needed
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
          // Create new user
          await prisma.user.create({
            data: {
              azureAdObjectId: graphUser.id,
              email: normalizedEmail,
              fullName: processedDisplayName,
              role: 'Unassigned', // Default role for tenant users
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

  } catch (error: any) {
    ctx.log.error("[SyncTenantUsers] Sync failed:", error);
    throw error;
  }
}

/**
 * Azure Function: SyncTenantUsers
 * Timer-triggered function that runs every hour
 */
const syncTenantUsers: AzureFunction = withErrorHandler(
  async (ctx: Context, myTimer: Timer) => {
    await syncTenantUsersHandler(ctx, myTimer);
  },
  {
    genericMessage: "Internal Server Error in SyncTenantUsers",
    showStackInDev: true,
  }
);

export default syncTenantUsers;