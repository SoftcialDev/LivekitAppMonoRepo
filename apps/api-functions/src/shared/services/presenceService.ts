import prisma from "./prismaClienService";

/**
 * Marks a user as online.
 *
 * Looks up the user by Azure AD object ID or email, upserts the presence record
 * with status "online" and the current timestamp, and creates a new presence history entry
 * with `connectedAt` set to now and `disconnectedAt` as null.
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

  // Upsert presence record with status "online"
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

  // Create a presence history entry for when the user connects
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
 * with status "offline" and the current timestamp, and closes the latest open
 * presence history entry by setting `disconnectedAt` to now if one exists.
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

  // Upsert presence record with status "offline"
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

  // Find the most recent open presence history (where `disconnectedAt` is null)
  const openHistory = await prisma.presenceHistory.findFirst({
    where: {
      userId: user.id,
      disconnectedAt: null
    },
    orderBy: { connectedAt: "desc" }
  });

  if (openHistory) {
    // Close the latest open presence history by setting `disconnectedAt` to now
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
 * @returns A promise that resolves to "online" or "offline" based on the most recent presence record.
 * @throws Error if no matching user is found.
 */
export async function getPresenceStatus(userIdOrEmail: string): Promise<"online" | "offline"> {
  console.log("getPresenceStatus called for:", userIdOrEmail);
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

  // Get the most recent presence record
  const latestPresence = await prisma.presence.findFirst({
    where: { userId: user.id },
    orderBy: { lastSeenAt: "desc" }, // Order by the most recent entry
  });

  // Return the status, or default to "offline" if no record exists
  return latestPresence?.status ?? "offline";
}
