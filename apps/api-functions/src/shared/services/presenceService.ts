import prisma from "./prismaClienService";

/**
 * Marks a user as online.
 *
 * Looks up the user by Azure AD object ID or email, upserts the presence record
 * with status "online" and current timestamp, and creates a new presence history entry
 * with connectedAt set to now and disconnectedAt null.
 *
 * @param userIdOrEmail - Azure AD object ID or email of the user.
 * @returns A promise that resolves when the presence update and history entry are created.
 * @throws Error if no matching user is found.
 */
export async function setUserOnline(userIdOrEmail: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { azureAdObjectId: userIdOrEmail },
        { email: userIdOrEmail }
      ],
      deletedAt: null
    }
  });
  if (!user) {
    throw new Error("User not found for presence update");
  }
  const now = new Date();
  await prisma.presence.upsert({
    where: { userId: user.id },
    create: {
      user: { connect: { id: user.id } },
      status: "online",
      lastSeenAt: now
    },
    update: {
      status: "online",
      lastSeenAt: now
    }
  });
  await prisma.presenceHistory.create({
    data: {
      user: { connect: { id: user.id } },
      connectedAt: now,
      disconnectedAt: null
    }
  });
}

/**
 * Marks a user as offline.
 *
 * Looks up the user by Azure AD object ID or email, upserts the presence record
 * with status "offline" and current timestamp, and closes the latest open
 * presence history entry by setting disconnectedAt to now if one exists.
 *
 * @param userIdOrEmail - Azure AD object ID or email of the user.
 * @returns A promise that resolves when the presence update and history closure are done.
 * @throws Error if no matching user is found.
 */
export async function setUserOffline(userIdOrEmail: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { azureAdObjectId: userIdOrEmail },
        { email: userIdOrEmail }
      ],
      deletedAt: null
    }
  });
  if (!user) {
    throw new Error("User not found for presence update");
  }
  const now = new Date();
  await prisma.presence.upsert({
    where: { userId: user.id },
    create: {
      user: { connect: { id: user.id } },
      status: "offline",
      lastSeenAt: now
    },
    update: {
      status: "offline",
      lastSeenAt: now
    }
  });
  const openHistory = await prisma.presenceHistory.findFirst({
    where: {
      userId: user.id,
      disconnectedAt: null
    },
    orderBy: { connectedAt: "desc" }
  });
  if (openHistory) {
    await prisma.presenceHistory.update({
      where: { id: openHistory.id },
      data: { disconnectedAt: now }
    });
  }
}

/**
 * Retrieves the current presence status of a user.
 *
 * Looks up the user by Azure AD object ID or email, then returns "online" or "offline"
 * based on the presence record. Returns "offline" if no presence record exists.
 *
 * @param userIdOrEmail - Azure AD object ID or email of the user.
 * @returns A promise that resolves to "online" or "offline".
 * @throws Error if no matching user is found.
 */
export async function getPresenceStatus(userIdOrEmail: string): Promise<"online" | "offline"> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { azureAdObjectId: userIdOrEmail },
        { email: userIdOrEmail }
      ],
      deletedAt: null
    }
  });
  if (!user) {
    throw new Error("User not found for presence query");
  }
  const presence = await prisma.presence.findUnique({
    where: { userId: user.id }
  });
  return presence?.status ?? "offline";
}
