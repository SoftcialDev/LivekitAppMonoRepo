import prisma from "./prismaClienService";
import { isUuid } from "../utils/uuid";
import { sendToGroup } from "./webPubSubService";

/* -------------------------------------------------------------------------- */
/*  Helper: normalize user key (UUID ↔ email)                                 */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes a user key—either an internal UUID or an email address—into
 * the canonical database UUID. If the key does not match any active user,
 * returns `null`.
 *
 * @param userKey - The user’s UUID or email (any casing).
 * @returns The persisted UUID for that user, or `null` if not found.
 */
async function resolveUserId(userKey: string): Promise<string | null> {
  // Fast path: if it already looks like a UUID, assume it’s correct.
  if (isUuid(userKey)) {
    return userKey;
  }

  const email = userKey.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });

  return user?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/*                          Streaming session API                             */
/* -------------------------------------------------------------------------- */

/**
 * Starts a new streaming session for the given user:
 * 1. Closes any existing open sessions by setting `stoppedAt = now()`.
 * 2. Inserts a fresh record in `StreamingSessionHistory` with `startedAt = now()`.
 * 3. Broadcasts a `"started"` event to the user’s Web PubSub group.
 *
 * @param userKey - The user’s UUID or email.
 */
export async function startStreamingSession(userKey: string): Promise<void> {
  const userId = await resolveUserId(userKey);
  if (!userId) {
    console.warn(`[startStreamingSession] User not found: ${userKey}`);
    return;
  }

  // 1) Close any previous open session
  await prisma.streamingSessionHistory.updateMany({
    where: { userId, stoppedAt: null },
    data: { stoppedAt: new Date() },
  });

  // 2) Create a new streaming session record
  await prisma.streamingSessionHistory.create({
    data: { userId },
  });

   const { email } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  await broadcastStreamEvent(email, "started");
}

/**
 * Stops the current streaming session for the given user:
 * 1. Marks all open sessions (`stoppedAt IS NULL`) as stopped.
 * 2. Broadcasts a `"stopped"` event to the user’s Web PubSub group.
 *
 * @param userKey - The user’s UUID or email.
 */
export async function stopStreamingSession(userKey: string): Promise<void> {
  const userId = await resolveUserId(userKey);
  if (!userId) {
    console.warn(`[stopStreamingSession] User not found: ${userKey}`);
    return;
  }

  // 1) Close all open sessions
  await prisma.streamingSessionHistory.updateMany({
    where: { userId, stoppedAt: null },
    data: { stoppedAt: new Date() },
  });
  const { email } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true },
  });
  await broadcastStreamEvent(email, "stopped");
}

/**
 * Retrieves the most recent streaming session for the given user.
 *
 * @param userKey - The user’s UUID or email.
 * @returns The latest `StreamingSessionHistory` record, or `null` if none exists.
 */
export async function getLastStreamingSession(userKey: string) {
  const userId = await resolveUserId(userKey);
  if (!userId) return null;

  return prisma.streamingSessionHistory.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
}

/**
 * Checks whether the user currently has an open streaming session.
 *
 * @param userKey - The user’s UUID or email.
 * @returns `true` if there is at least one session with `stoppedAt = NULL`; otherwise `false`.
 */
export async function isUserStreaming(userKey: string): Promise<boolean> {
  const userId = await resolveUserId(userKey);
  if (!userId) return false;

  const openCount = await prisma.streamingSessionHistory.count({
    where: { userId, stoppedAt: null },
  });
  return openCount > 0;
}

/* -------------------------------------------------------------------------- */
/*                    Internal: broadcast stream events                       */
/* -------------------------------------------------------------------------- */

/**
 * Broadcasts a streaming‐status update message to the specified Web PubSub group.
 *
 * We use the viewer’s email as the group name, so any client subscribed
 * under that email will receive real‐time `"started"` or `"stopped"` notifications.
 *
 * @param userId      The internal UUID of the user whose stream changed.
 * @param status      `"started"` when the stream opens, `"stopped"` when it ends.
 * @param viewerEmail The normalized email of the viewing client (the Web PubSub group).
 */
/**
 * Broadcasts a streaming‐status update to the given email‐group.
 *
 * @param userEmail The user’s canonical email (lowercased).
 * @param status    `"started"` or `"stopped"`.
 */
async function broadcastStreamEvent(
  userEmail: string,
  status: "started" | "stopped"
): Promise<void> {
  const group = userEmail.trim().toLowerCase();
  await sendToGroup(group, { email: userEmail, status });
}