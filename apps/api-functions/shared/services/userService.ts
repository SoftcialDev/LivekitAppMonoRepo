import prisma from "./prismaClienService";
import { isUuid } from "../utils/uuid";
import { Prisma, User } from "@prisma/client";

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


/**
 * Fetches a user by their Azure AD Object ID (UUID).
 * @param oid - the Azure AD Object ID
 * @returns the User record or null
 */
export async function getUserByAzureOid(oid: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { azureAdObjectId: oid } });
}

/**
 * Upsert (create / update) a user.
 *
 * `supervisorId`  • undefined ⇒ untouched  • UUID ⇒ set  • null ⇒ clear
 */
export async function upsertUserRole(
  email: string,
  azureAdObjectId: string,
  fullName: string,
  role: "Admin" | "Supervisor" | "Employee",
  supervisorId?: string | null            // ← optional: omit = no touch
): Promise<{ id: string }> {
  const canonicalEmail = email.toLowerCase();

  /* ── validation ───────────────────────────────────────────────────── */
  if (!isUuid(azureAdObjectId)) {
    throw new Error(`Invalid azureAdObjectId: ${azureAdObjectId}`);
  }
  if (
    supervisorId !== undefined &&
    supervisorId !== null &&
    !isUuid(supervisorId)
  ) {
    throw new Error(`Invalid supervisorId: ${supervisorId}`);
  }

  /* builders keep types strict */
  const makeCreate = (): Prisma.UserUncheckedCreateInput => ({
    azureAdObjectId,
    email: canonicalEmail,
    fullName,
    role,
    roleChangedAt: new Date(),
    ...(supervisorId !== undefined ? { supervisorId } : {}),
  });

  const makeUpdate = (): Prisma.UserUncheckedUpdateInput => ({
    email: canonicalEmail,
    fullName,
    role,
    roleChangedAt: new Date(),
    ...(supervisorId !== undefined ? { supervisorId } : {}),
  });

  /* 1️⃣ match by OID --------------------------------------------------- */
  let user = await prisma.user.findUnique({ where: { azureAdObjectId } });
  if (user) {
    console.log(`[upsertUserRole] OID match → updating ${user.id}`);
    return prisma.user.update({
      where: { id: user.id },
      data: makeUpdate(),
      select: { id: true },
    });
  }

  /* 2️⃣ match by e-mail ------------------------------------------------- */
  user = await prisma.user.findUnique({ where: { email: canonicalEmail } });
  if (user) {
    console.log(`[upsertUserRole] e-mail match → updating ${user.id}`);
    return prisma.user.update({
      where:  { id: user.id },
      data:   {
        ...makeUpdate(),
        azureAdObjectId: { set: azureAdObjectId }, // update-type syntax ✔
      },
      select: { id: true },
    });
  }

  /* 3️⃣ create ---------------------------------------------------------- */
  console.log("[upsertUserRole] creating new user");
  return prisma.user.create({
    data:   makeCreate(),
    select: { id: true },
  });
}
