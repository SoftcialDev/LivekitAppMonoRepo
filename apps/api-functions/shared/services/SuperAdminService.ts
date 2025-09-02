import prisma from "./prismaClienService";
import {
  getGraphToken,
  assignAppRoleToPrincipal,
  removeAllAppRolesFromPrincipalOnSp,
  fetchAllUsers,
} from "./graphService";
import { config } from "../config";
import { UserRole } from "@prisma/client";

/**
 * Minimal shape returned for Super Admin users.
 */
export interface SuperAdminDto {
  /** Internal user ID */
  id: string;
  /** User’s Azure AD object ID */
  azureAdObjectId: string;
  /** Email address */
  email: string;
  /** Full name */
  fullName: string;
  /** Current role */
  role: UserRole;
  /** When the role was last updated */
  roleChangedAt: Date | null;
  /** When the user was created */
  createdAt: Date;
  /** When the user was last updated */
  updatedAt: Date;
}

/**
 * Lists all users with the SuperAdmin role.
 *
 * @returns Array of {@link SuperAdminDto}.
 */
export async function listSuperAdmins(): Promise<SuperAdminDto[]> {
  const users = await prisma.user.findMany({
    where: { role: UserRole.SuperAdmin },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    azureAdObjectId: u.azureAdObjectId,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    roleChangedAt: u.roleChangedAt ?? null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

/**
 * Ensures a user exists, assigns the Super Admin Azure AD app role, and sets the local role to SuperAdmin.
 *
 * - If the user does not exist, it is created from Microsoft Graph data.
 * - Existing app role assignments for the service principal are cleared before assignment.
 *
 * @param email Email address (case-insensitive).
 * @returns The resulting {@link SuperAdminDto}.
 * @throws If the Graph user cannot be found or if required configuration is missing.
 */
export async function addSuperAdmin(email: string): Promise<SuperAdminDto> {
  const normalizedEmail = email.toLowerCase();

  // Find or create the user
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    const token = await getGraphToken();
    const allGraphUsers = await fetchAllUsers(token);
    const graphUser = allGraphUsers.find((u) => {
      const addr = (u.mail ?? u.userPrincipalName ?? "").toLowerCase();
      return addr === normalizedEmail;
    });
    if (!graphUser) {
      throw new Error(`Graph user with email "${email}" not found`);
    }

    user = await prisma.user.create({
      data: {
        azureAdObjectId: graphUser.id,
        email: normalizedEmail,
        fullName: graphUser.displayName ?? normalizedEmail,
        role: UserRole.SuperAdmin,
        roleChangedAt: new Date(),
      },
    });
  }

  // Assign Azure AD app role
  const token = await getGraphToken();
  const spId = config.servicePrincipalObjectId!;
  const roleId = config.superAdminAppRoleId!;
  await removeAllAppRolesFromPrincipalOnSp(token, spId, user.azureAdObjectId);
  await assignAppRoleToPrincipal(token, spId, user.azureAdObjectId, roleId);

  // Ensure local role is SuperAdmin
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.SuperAdmin, roleChangedAt: new Date() },
  });

  return {
    id: updated.id,
    azureAdObjectId: updated.azureAdObjectId,
    email: updated.email,
    fullName: updated.fullName,
    role: updated.role,
    roleChangedAt: updated.roleChangedAt ?? null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Revokes the Super Admin Azure AD app role and demotes the local user role.
 *
 * This does not delete the user record. Use this when removing elevated privileges
 * from an existing account.
 *
 * @param userId Internal user ID to demote.
 * @param demoteTo Target role after revocation. Defaults to {@link UserRole.Employee}.
 * @throws If the user cannot be found.
 */
export async function revokeSuperAdmin(
  userId: string,
  demoteTo: UserRole = UserRole.Employee
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`User "${userId}" not found`);
  }

  const token = await getGraphToken();
  const spId = config.servicePrincipalObjectId!;
  await removeAllAppRolesFromPrincipalOnSp(token, spId, user.azureAdObjectId);

  await prisma.user.delete({
    where: { id: user.id },
  });
}

/**
 * Gets the calling Super Admin by Azure AD object ID.
 *
 * @param azureAdObjectId Azure AD OID claim.
 * @returns {@link SuperAdminDto} for the matching user.
 * @throws If the user is not found or does not have the SuperAdmin role.
 */
export async function getMySuperAdmin(
  azureAdObjectId: string
): Promise<SuperAdminDto> {
  const user = await prisma.user.findUnique({
    where: { azureAdObjectId },
  });

  if (!user || user.role !== UserRole.SuperAdmin) {
    throw new Error(`Super Admin for OID "${azureAdObjectId}" not found`);
  }

  return {
    id: user.id,
    azureAdObjectId: user.azureAdObjectId,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    roleChangedAt: user.roleChangedAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
