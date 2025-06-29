import prisma from "./prismaClienService";

/**
 * Marks a user as online.
 *
 * Looks up the user by database ID, Azure AD object ID or email,
 * upserts the presence record with status "online" and the current timestamp,
 * and creates a new presence history entry with `connectedAt` set to now.
 *
 * @param userIdOrEmailOrOid - User's DB UUID, Azure AD object ID or email.
 */
export async function setUserOnline(
  userIdOrEmailOrOid: string
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: userIdOrEmailOrOid },
        { azureAdObjectId: userIdOrEmailOrOid },
        { email: userIdOrEmailOrOid },
      ],
    },
  });
  if (!user) throw new Error("User not found for presence update");

  const now = new Date();
  await prisma.presence.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, status: "online", lastSeenAt: now },
    update: { status: "online", lastSeenAt: now },
  });
  await prisma.presenceHistory.create({
    data: { userId: user.id, connectedAt: now, disconnectedAt: null },
  });
}

/**
 * Marks a user as offline.
 *
 * Same lookup logic as setUserOnline, upserts presence→"offline",
 * and closes the most recent open history entry.
 *
 * @param userIdOrEmailOrOid - User's DB UUID, Azure AD object ID or email.
 */
export async function setUserOffline(
  userIdOrEmailOrOid: string
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: userIdOrEmailOrOid },
        { azureAdObjectId: userIdOrEmailOrOid },
        { email: userIdOrEmailOrOid },
      ],
    },
  });
  if (!user) throw new Error("User not found for presence update");

  const now = new Date();
  await prisma.presence.upsert({
    where:  { userId: user.id },
    create: { userId: user.id, status: "offline", lastSeenAt: now },
    update: { status: "offline", lastSeenAt: now },
  });

  const open = await prisma.presenceHistory.findFirst({
    where: { userId: user.id, disconnectedAt: null },
    orderBy: { connectedAt: "desc" },
  });
  if (open) {
    await prisma.presenceHistory.update({
      where: { id: open.id },
      data: { disconnectedAt: now },
    });
  }
}

/**
 * Retrieves the current presence status of a user.
 *
 * Looks up the user by DB UUID, Azure AD object ID or email,
 * then returns "online" or "offline" based on the most recent
 * row in `presence`. Defaults to "offline" if no record exists.
 *
 * @param userIdOrEmailOrOid - User's DB UUID, Azure AD object ID or email.
 * @returns "online" | "offline"
 */
export async function getPresenceStatus(
  userIdOrEmailOrOid: string
): Promise<"online" | "offline"> {
  console.log("getPresenceStatus called for:", userIdOrEmailOrOid);

  const user = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: userIdOrEmailOrOid },
        { azureAdObjectId: userIdOrEmailOrOid },
        { email: userIdOrEmailOrOid },
      ],
    },
  });
  if (!user) throw new Error("User not found for presence query");

  const presence = await prisma.presence.findFirst({
    where: { userId: user.id },
    orderBy: { lastSeenAt: "desc" },
  });

  return presence?.status ?? "offline";
}
