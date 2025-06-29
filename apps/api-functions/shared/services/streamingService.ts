// src/shared/services/streamingService.ts

import prisma from "./prismaClienService";

/**
 * Starts a new streaming session for the given user.
 *
 * - Closes any existing open session (without a `stoppedAt`) by setting its `stoppedAt` to now.
 * - Creates a new record in `StreamingSessionHistory` with `startedAt = now()`.
 *
 * @param userId UUID of the user starting the stream
 */
export async function startStreamingSession(userId: string): Promise<void> {
  // 1) Close any previous session left open
  await prisma.streamingSessionHistory.updateMany({
    where: {
      userId,
      stoppedAt: null,
    },
    data: {
      stoppedAt: new Date(),
    },
  });

  // 2) Create a new streaming session record
  await prisma.streamingSessionHistory.create({
    data: {
      userId,
      // `startedAt` and `createdAt` default to now()
    },
  });
}

/**
 * Stops the current streaming session for the given user.
 *
 * - Finds all open sessions (`stoppedAt IS NULL`) and sets their `stoppedAt` to now.
 *
 * @param userId UUID of the user stopping the stream
 */
export async function stopStreamingSession(userId: string): Promise<void> {
  await prisma.streamingSessionHistory.updateMany({
    where: {
      userId,
      stoppedAt: null,
    },
    data: {
      stoppedAt: new Date(),
    },
  });
}

/**
 * Retrieves the most recent streaming session for the given user.
 *
 * @param userId UUID of the user
 * @returns The last StreamingSessionHistory record, or null if none exists
 */
export async function getLastStreamingSession(userId: string) {
  return prisma.streamingSessionHistory.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });
}

/**
 * Returns whether the user is currently streaming.
 *
 * A user is considered "streaming" if they have an open session
 * (i.e., a record with `stoppedAt = NULL`).
 *
 * @param userId UUID of the user
 * @returns True if streaming is in progress, false otherwise
 */
export async function isUserStreaming(userId: string): Promise<boolean> {
  const openCount = await prisma.streamingSessionHistory.count({
    where: { userId, stoppedAt: null },
  });
  return openCount > 0;
}
