import prisma from "./prismaClienService";

/**
 * Finds an existing Admin user by Azure AD ID or creates one if not found.
 *
 * @param azureAdObjectId - The Azure AD object ID of the caller.
 * @param email           - The caller’s UPN/email.
 * @param fullName        - The caller’s display name from Azure AD.
 * @returns The database user record.
 */
export async function findOrCreateAdmin(
  azureAdObjectId: string,
  email: string,
  fullName: string
) {
  let user = await prisma.user.findUnique({
    where: { azureAdObjectId },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        azureAdObjectId,
        email,
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
 * Deletes a user record by email.
 *
 * @param email - The user’s email address.
 */
export async function deleteUserByEmail(email: string) {
  await prisma.user.delete({ where: { email } });
}

/**
 * Inserts or updates a user’s role and profile in the database.
 *
 * @param email        - The user’s email address.
 * @param azureAdObjectId - The user’s Azure AD object ID.
 * @param fullName     - The user’s display name.
 * @param role         - One of “Admin”, “Supervisor”, or “Employee”.
 * @param supervisorId - Optional supervisor’s database ID.
 */
export async function upsertUserRole(
  email: string,
  azureAdObjectId: string,
  fullName: string,
  role: "Admin" | "Supervisor" | "Employee",
  supervisorId: string | null = null
) {
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      azureAdObjectId,
      fullName,
      role,
      roleChangedAt: new Date(),
      supervisorId,
    },
    update: {
      fullName,
      role,
      roleChangedAt: new Date(),
      supervisorId,
    },
  });
}
