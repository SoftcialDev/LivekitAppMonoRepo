import prisma from "./prismaClienService";
import { isUuid } from "../utils/uuid";

/* -------------------------------------------------------------------------- */
/*  Admin bootstrap                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Finds an existing Admin user by Azure AD object ID or creates a new one.
 * Ensures the stored email is always lower-cased for canonical lookups.
 *
 * @param azureAdObjectId - The Azure AD Object ID (UUID) of the user.
 * @param email           - The user’s UPN/email address.
 * @param fullName        - The user’s display name from Azure AD.
 * @returns A promise that resolves to the existing or newly created Prisma User record.
 */
export async function findOrCreateAdmin(
  azureAdObjectId: string,
  email: string,
  fullName: string,
): Promise<import("@prisma/client").User> {
  const canonicalEmail = email.toLowerCase();

  let user = await prisma.user.findUnique({
    where: { azureAdObjectId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        azureAdObjectId,
        email: canonicalEmail,
        fullName,
        role: "Admin",
        roleChangedAt: new Date(),
        supervisorId: null,
      },
    });
  }

  return user;
}

/**
 * Deletes a user record by email (case-insensitive).
 *
 * @param email - The user’s email address to delete.
 * @returns A promise that resolves when the user has been deleted.
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  await prisma.user.delete({
    where: { email: email.toLowerCase() },
  });
}

/* -------------------------------------------------------------------------- */
/*  Role upsert                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Inserts or updates a user’s role and profile in the database.
 *  
 * This function:
 *   1. Attempts to find an existing user by Azure AD Object ID and update them.
 *   2. If not found, attempts to find by email and update them.
 *   3. If still not found, creates a new user record.
 *
 * @param email             - The user’s email address.
 * @param azureAdObjectId   - The user’s Azure AD object ID (must be a valid UUID).
 * @param fullName          - The user’s display name.
 * @param role              - One of "Admin", "Supervisor", or "Employee".
 * @param supervisorId      - Optional supervisor’s DB ID (UUID) or `null` to clear.
 *
 * @returns A promise that resolves to an object containing the user’s database `id`.
 *
 * @throws If `azureAdObjectId` or `supervisorId` (when provided) is not a valid UUID.
 */
export async function upsertUserRole(
  email: string,
  azureAdObjectId: string,
  fullName: string,
  role: "Admin" | "Supervisor" | "Employee",
  supervisorId: string | null = null,
): Promise<{ id: string }> {
  console.log("[upsertUserRole] called with:", {
    email,
    azureAdObjectId,
    fullName,
    role,
    supervisorId,
  });

  // Normalize email
  const canonicalEmail = email.toLowerCase();

  // Validate UUID inputs
  if (!isUuid(azureAdObjectId)) {
    throw new Error(`Invalid azureAdObjectId: ${azureAdObjectId}`);
  }
  if (supervisorId !== null && !isUuid(supervisorId)) {
    throw new Error(`Invalid supervisorId: ${supervisorId}`);
  }

  // 1️⃣ Find by Azure AD Object ID
  let user = await prisma.user.findUnique({
    where: { azureAdObjectId },
  });

  if (user) {
    console.log("[upsertUserRole] updating existing user by Azure AD ID:", user.id);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: canonicalEmail,
        fullName,
        role,
        roleChangedAt: new Date(),
        supervisorId,
      },
      select: { id: true },
    });
    console.log("[upsertUserRole] updated user.id =", updated.id);
    return updated;
  }

  // 2️⃣ Find by email
  user = await prisma.user.findUnique({
    where: { email: canonicalEmail },
  });

  if (user) {
    console.log("[upsertUserRole] updating existing user by email:", user.id);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        azureAdObjectId,
        fullName,
        role,
        roleChangedAt: new Date(),
        supervisorId,
      },
      select: { id: true },
    });
    console.log("[upsertUserRole] updated user.id =", updated.id);
    return updated;
  }

  // 3️⃣ Create new user
  console.log("[upsertUserRole] creating new user");
  const created = await prisma.user.create({
    data: {
      azureAdObjectId,
      email: canonicalEmail,
      fullName,
      role,
      roleChangedAt: new Date(),
      supervisorId,
    },
    select: { id: true },
  });
  console.log("[upsertUserRole] created user.id =", created.id);
  return created;
}

/**
 * Retrieves a user record by email (case-insensitive).
 *
 * @param email - The user’s email address.
 * @returns A promise that resolves to the Prisma User record or `null` if none found.
 */
export async function getUserByEmail(
  email: string,
): Promise<import("@prisma/client").User | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}
