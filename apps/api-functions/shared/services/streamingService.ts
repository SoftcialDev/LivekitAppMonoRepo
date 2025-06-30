import prisma from "./prismaClienService";

/* -------------------------------------------------------------------------- */
/*  Helper: normaliza la clave de usuario (UUID ↔ email)                      */
/* -------------------------------------------------------------------------- */

// UUID v1‑v5 regex (case‑insensitive)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Acepta tanto el UUID interno del usuario como su email (cualquier casing) y
 * devuelve siempre el UUID persistido en la base de datos.
 *
 * Si la clave no corresponde a ningún usuario activo, devuelve `null`.
 */
async function resolveUserId(userKey: string): Promise<string | null> {
  if (UUID_RE.test(userKey)) {
    // Ya es un UUID — asumimos que es correcto (evitamos lookup extra)
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
/*                           Streaming session API                            */
/* -------------------------------------------------------------------------- */

/**
 * Cierra cualquier sesión previa y abre una nueva para el usuario.
 */
export async function startStreamingSession(userKey: string): Promise<void> {
  const userId = await resolveUserId(userKey);
  if (!userId) {
    console.warn(`[startStreamingSession] Usuario no encontrado: ${userKey}`);
    return;
  }

  // 1) Cierra sesiones abiertas
  await prisma.streamingSessionHistory.updateMany({
    where: { userId, stoppedAt: null },
    data: { stoppedAt: new Date() },
  });

  // 2) Crea nueva entrada
  await prisma.streamingSessionHistory.create({ data: { userId } });
}

/**
 * Marca como finalizadas todas las sesiones abiertas.
 */
export async function stopStreamingSession(userKey: string): Promise<void> {
  const userId = await resolveUserId(userKey);
  if (!userId) {
    console.warn(`[stopStreamingSession] Usuario no encontrado: ${userKey}`);
    return;
  }

  await prisma.streamingSessionHistory.updateMany({
    where: { userId, stoppedAt: null },
    data: { stoppedAt: new Date() },
  });
}

/**
 * Devuelve la sesión más reciente (o `null`).
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
 * Indica si el usuario está actualmente transmitiendo (sesión abierta).
 */
export async function isUserStreaming(userKey: string): Promise<boolean> {
  const userId = await resolveUserId(userKey);
  if (!userId) return false;

  const openCount = await prisma.streamingSessionHistory.count({
    where: { userId, stoppedAt: null },
  });
  return openCount > 0;
}
