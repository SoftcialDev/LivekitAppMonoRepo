import prisma from "./prismaClienService";
import { isUuid } from "../utils/uuid";

/* -------------------------------------------------------------------------- */
/*  ⚡ Flexible user lookup                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Finds an *active* user (deletedAt IS NULL) by:
 *   • Database UUID  – when `key` is a valid UUID
 *   • Azure AD OID   – when `key` is a valid UUID
 *   • E-mail         – always (lower-cased)
 *
 * @throws Error if no matching, non-deleted user exists.
 */
async function findActiveUserFlexible(key: string) {
  const or: import("@prisma/client").Prisma.UserWhereInput[] = [];

  if (isUuid(key)) {
    or.push({ id: key }, { azureAdObjectId: key });
  }
  or.push({ email: key.toLowerCase() });

  console.log("[findActiveUserFlexible] OR criteria →", JSON.stringify(or));

  const user = await prisma.user.findFirst({
    where: { deletedAt: null, OR: or },
  });

  if (!user) {
    console.error("[findActiveUserFlexible] NOT FOUND for key:", key);
    throw new Error(`User not found for presence operation (${key})`);
  }

  console.log(
    "[findActiveUserFlexible] found id=%s role=%s",
    user.id,
    user.role,
  );
  return user;
}

/* -------------------------------------------------------------------------- */
/*  📡 ONLINE / OFFLINE handlers                                              */
/* -------------------------------------------------------------------------- */

export async function setUserOnline(key: string): Promise<void> {
  console.log("[setUserOnline] lookup key:", key);
  const user = await findActiveUserFlexible(key);

  const now = new Date();

  // Run both inserts/updates atomically
  const [presence, history] = await prisma.$transaction([
    prisma.presence.upsert({
      where: { userId: user.id },
      create: { userId: user.id, status: "online", lastSeenAt: now },
      update: { status: "online", lastSeenAt: now },
    }),
    prisma.presenceHistory.create({
      data: { userId: user.id, connectedAt: now, disconnectedAt: null },
    }),
  ]);

  console.log("[setUserOnline] presence row →", presence);
  console.log("[setUserOnline] history row  →", history);
  console.log("[setUserOnline] SUCCESS for user:", user.id);
}

export async function setUserOffline(key: string): Promise<void> {
  console.log("[setUserOffline] lookup key:", key);
  const user = await findActiveUserFlexible(key);

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const presence = await tx.presence.upsert({
      where: { userId: user.id },
      create: { userId: user.id, status: "offline", lastSeenAt: now },
      update: { status: "offline", lastSeenAt: now },
    });

    console.log("[setUserOffline][tx] presence updated →", presence);

    const open = await tx.presenceHistory.findFirst({
      where: { userId: user.id, disconnectedAt: null },
      orderBy: { connectedAt: "desc" },
    });

    if (open) {
      await tx.presenceHistory.update({
        where: { id: open.id },
        data: { disconnectedAt: now },
      });
      console.log(
        "[setUserOffline][tx] closed history id=%s (connectedAt=%s)",
        open.id,
        open.connectedAt.toISOString(),
      );
    } else {
      console.log("[setUserOffline][tx] no open history found");
    }
  });

  console.log("[setUserOffline] SUCCESS for user:", user.id);
}

/* -------------------------------------------------------------------------- */
/*  🔍 Presence query                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Returns the user’s last known status (`"online"` or `"offline"`).
 * Defaults to `"offline"` when no presence record exists.
 */
export async function getPresenceStatus(
  key: string,
): Promise<"online" | "offline"> {
  console.log("[getPresenceStatus] lookup key:", key);
  const user = await findActiveUserFlexible(key);

  const presence = await prisma.presence.findFirst({
    where: { userId: user.id },
    orderBy: { lastSeenAt: "desc" },
  });

  console.log(
    "[getPresenceStatus] presence row →",
    presence ? presence : "(none)",
  );

  return presence?.status ?? "offline";
}
