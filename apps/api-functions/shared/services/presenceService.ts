import prisma from "./prismaClienService";
import { isUuid } from "../utils/uuid";
import { broadcastPresence } from "./webPubSubService";

/* ────────────────────────────────────────────────────────────────────────── */
/*  🔍 Flexible user lookup                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Returns a *non-deleted* user matched by one of:
 *  • database UUID                     (`id`)
 *  • Azure AD object ID                (`azureAdObjectId`)
 *  • e-mail address (always lower-cased)
 *
 * @throws If no active user matches the **key**.
 */
async function findActiveUserFlexible(key: string) {
  const OR: import("@prisma/client").Prisma.UserWhereInput[] = [];

  if (isUuid(key)) {
    OR.push({ id: key }, { azureAdObjectId: key });
  }
  OR.push({ email: key.toLowerCase() });

  const user = await prisma.user.findFirst({
    where: { deletedAt: null, OR },
  });

  if (!user) {
    throw new Error(`User not found for presence operation (${key})`);
  }
  return user;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  📡 ONLINE / OFFLINE handlers                                             */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Marks the user **online** and broadcasts the change.
 */
export async function setUserOnline(key: string): Promise<void> {
  const user = await findActiveUserFlexible(key);
  const now  = new Date();

  await prisma.$transaction([
    prisma.presence.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, status: "online", lastSeenAt: now },
      update: {               status: "online", lastSeenAt: now },
    }),
    prisma.presenceHistory.create({
      data: { userId: user.id, connectedAt: now },
    }),
  ]);

  await broadcastPresence({
    email: user.email,
    fullName: user.fullName,
    status: "online",
    lastSeenAt: now.toISOString(),
  });
}

/**
 * Marks the user **offline**, closes any open history entry and
 * broadcasts the change.
 */
export async function setUserOffline(key: string): Promise<void> {
  const user = await findActiveUserFlexible(key);
  const now  = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.presence.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, status: "offline", lastSeenAt: now },
      update: {               status: "offline", lastSeenAt: now },
    });

    const open = await tx.presenceHistory.findFirst({
      where:   { userId: user.id, disconnectedAt: null },
      orderBy: { connectedAt: "desc" },
    });
    if (open) {
      await tx.presenceHistory.update({
        where: { id: open.id },
        data : { disconnectedAt: now },
      });
    }
  });

  await broadcastPresence({
    email: user.email,
    fullName: user.fullName,
    status: "offline",
    lastSeenAt: now.toISOString(),
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  🔍 STATUS QUERY                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Returns `"online"` or `"offline"` according to the latest presence row;
 * defaults to `"offline"` when no presence record exists.
 */
export async function getPresenceStatus(
  key: string,
): Promise<"online" | "offline"> {
  const user     = await findActiveUserFlexible(key);
  const presence = await prisma.presence.findFirst({
    where:   { userId: user.id },
    orderBy: { lastSeenAt: "desc" },
  });
  return presence?.status ?? "offline";
}
