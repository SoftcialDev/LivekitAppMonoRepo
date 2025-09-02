import prisma from "./prismaClienService";
import {
  getGraphToken,
  assignAppRoleToPrincipal,
  removeAllAppRolesFromPrincipalOnSp,
  fetchAllUsers,
} from "./graphService";
import { config } from "../config";
import { ContactManagerStatus, UserRole } from "@prisma/client";
import { sendToGroup } from "./webPubSubService";



/**
 * DTO returned for a ContactManagerProfile.
 */
export interface ContactManagerProfileDto {
  /** Profile record UUID */
  id: string;
  /** User’s Azure AD object ID */
  userId: string;
  /** Current status */
  status: ContactManagerStatus;
  /** When this profile was created */
  createdAt: Date;
  /** When this profile was last updated */
  updatedAt: Date;

  fullName?: string;
  
  email?: string;
}
/**
 * Fetches all Contact Manager profiles along with their user info.
 *
 * @returns An array of objects each containing:
 *  - `id`:               Profile UUID
 *  - `email`:            User’s email
 *  - `fullName`:         User’s full name
 *  - `status`:           Current ContactManagerStatus
 *  - `createdAt`:        Profile creation timestamp
 *  - `updatedAt`:        Profile last‑updated timestamp
 */
export async function listContactManagers() {
  const rows = await prisma.contactManagerProfile.findMany({
    include: { user: { select: { email: true, fullName: true } } }
  });
  return rows.map(r => ({
    id:        r.id,
    email:     r.user.email,
    fullName:  r.user.fullName,
    status:    r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Assigns the Contact Manager app role in Azure AD, ensures the user exists in the database
 * (creating them if needed), promotes them to ContactManager, creates or updates the local profile,
 * and logs the initial status in history.
 *
 * @param email   The user’s email address (case-insensitive).
 * @param status  The initial on-duty status. Defaults to Unavailable.
 * @throws If the user cannot be found in Azure AD.
 */
export async function addContactManager(
  email: string,
  status: ContactManagerStatus = ContactManagerStatus.Unavailable
) {
  const normalizedEmail = email.toLowerCase();

  // 1) Try to find the user in our DB
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // 2) If not found, fetch from Graph and create a new user record
  if (!user) {
    const token = await getGraphToken();
    const allGraphUsers = await fetchAllUsers(token);
    const graphUser = allGraphUsers.find(u => {
      const userEmail = (u.mail ?? u.userPrincipalName ?? "").toLowerCase();
      return userEmail === normalizedEmail;
    });
    if (!graphUser) {
      throw new Error(`Graph user with email "${email}" not found`);
    }

    user = await prisma.user.create({
      data: {
        azureAdObjectId: graphUser.id,
        email: normalizedEmail,
        fullName: graphUser.displayName ?? normalizedEmail,
        // We can assign ContactManager immediately or default to another role
        role: UserRole.ContactManager,
        roleChangedAt: new Date(),
      },
    });
  }

  // 3) Acquire a fresh token and assign the ContactManager App Role in Azure AD
  const token = await getGraphToken();
  const spId = config.servicePrincipalObjectId!;
  const roleId = config.contactManagerAppRoleId!;
  await removeAllAppRolesFromPrincipalOnSp(token, spId, user.azureAdObjectId);
  await assignAppRoleToPrincipal(token, spId, user.azureAdObjectId, roleId);

  // 4) Promote in our DB schema (update role and timestamp)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: UserRole.ContactManager,
      roleChangedAt: new Date(),
    },
  });

  // 5) Upsert the local ContactManagerProfile
  const profile = await prisma.contactManagerProfile.upsert({
    where: { userId: user.id },
    update: { status },
    create: { userId: user.id, status },
  });

  // 6) Log the initial status in history
  await prisma.contactManagerStatusHistory.create({
    data: {
      profileId:      profile.id,
      previousStatus: status,
      newStatus:      status,
      changedById:    user.id,  // self-assignment
    },
  });

  return {
    id:        profile.id,
    email:     user.email,
    fullName:  user.fullName,
    status:    profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Updates the calling Contact Manager’s status by looking up their profile
 * via `userId` instead of `id`, records history, and notifies employees.
 *
 * @param userId    – The internal user ID of the Contact Manager.
 * @param newStatus – One of the ContactManagerStatus enum values.
 * @returns Promise resolving to the updated {@link ContactManagerProfileDto}.
 * @throws If no profile exists for the given `userId`.
 */
export async function updateMyContactManagerStatus(
  userId: string,
  newStatus: ContactManagerStatus
): Promise<ContactManagerProfileDto> {
  // 1) Find existing profile by userId
  const existing = await prisma.contactManagerProfile.findUnique({
    where: { userId }
  });
  if (!existing) {
    throw new Error(`Profile for user ${userId} not found`);
  }

  // 2) Record history entry
  await prisma.contactManagerStatusHistory.create({
    data: {
      profileId:      existing.id,
      previousStatus: existing.status,
      newStatus,
      changedById:    userId,
    },
  });

  // 3) Update profile’s status
  const updated = await prisma.contactManagerProfile.update({
    where: { userId },
    data:  { status: newStatus },
  });

  // 4) Notify real-time group of employees
  void sendToGroup("cm-status-updates", {
    managerId: updated.userId,
    status:    updated.status,
    updatedAt: updated.updatedAt.toISOString(),
  });

  return {
    id:        updated.id,
    userId:    updated.userId,
    status:    updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Revokes the Contact Manager app role in Azure AD, deletes the
 * corresponding local profile, and removes the user record from the database.
 *
 * @param profileId - The UUID of the ContactManagerProfile to revoke.
 * @throws If no profile with the given ID exists or if any operation fails.
 */
export async function revokeContactManager(profileId: string): Promise<void> {
  // 1) Retrieve the profile along with its associated user
  const profileWithUser = await prisma.contactManagerProfile.findUnique({
    where:   { id: profileId },
    include: { user: true },
  });
  if (!profileWithUser) {
    throw new Error(`Contact Manager profile "${profileId}" not found`);
  }

  // 2) Revoke all App Role assignments for the user in Azure AD
  const token = await getGraphToken();
  const servicePrincipalObjectId = config.servicePrincipalObjectId!;
  await removeAllAppRolesFromPrincipalOnSp(
    token,
    servicePrincipalObjectId,
    profileWithUser.user.azureAdObjectId
  );

  // 3) Delete the profile and the user in a single transaction
  await prisma.$transaction([
    prisma.contactManagerProfile.delete({
      where: { id: profileId },
    }),
    prisma.user.delete({
      where: { id: profileWithUser.user.id },
    }),
  ]);
}


/**
 * Fetches the ContactManagerProfile for the given Azure AD object ID.
 *
 * @param azureAdObjectId – The user’s OID claim from the token.
 * @returns Promise resolving to a {@link ContactManagerProfileDto}.
 * @throws If no matching user or profile is found.
 */
export async function getMyContactManagerProfile(
  azureAdObjectId: string
): Promise<ContactManagerProfileDto> {
  // 1) Find our internal user record by Azure AD OID
  const user = await prisma.user.findUnique({
    where: { azureAdObjectId },
  });
  if (!user || user.role !== UserRole.ContactManager) {
    throw new Error(`Contact Manager for OID "${azureAdObjectId}" not found`);
  }

  // 2) Look up their profile
  const profile = await prisma.contactManagerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    throw new Error(`Profile for user ${user.id} not found`);
  }

  return {
    id:        profile.id,
    userId:    profile.userId,
    email:     user.email,
    fullName:  user.fullName,
    status:    profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}