import { AzureFunction, Context } from "@azure/functions";

/**
 * Tipo mínimo para lo que nos interesa del contexto de conexión.
 * Ajusta si quieres loguear más propiedades.
 */
interface WebPubSubConnectionContext {
  hub: string;
  connectionId: string;
  userId?: string;
  eventType: string;
  eventName: string;
  states?: unknown;
  claims?: Record<string, string>;
  headers?: Record<string, string>;
}

/**
 * Función de prueba para eventos "system:connect".
 * No usa DI ni servicios externos.
 */
const testConnect: AzureFunction = async (
  context: Context,
  connectionContext: WebPubSubConnectionContext
): Promise<void> => {
  // Log inicial para saber que la función se ejecutó
  context.log("🔥 [TestConnect] Function START");
  context.log("🔥 [TestConnect] InvocationId:", context.invocationId);

  // Log de variables de entorno clave
  context.log("🔥 [TestConnect] process.env.WEBPUBSUB_HUB:", process.env.WEBPUBSUB_HUB);
  context.log("🔥 [TestConnect] process.env.WEBPUBSUB_CONNECTION exists?:", !!process.env.WEBPUBSUB_CONNECTION);

  try {
    // Log completo del contexto de conexión
    context.log("🔥 [TestConnect] Raw connectionContext object:");
    try {
      context.log(JSON.stringify(connectionContext, null, 2));
    } catch {
      context.log("No se pudo serializar connectionContext con JSON.stringify");
    }

    // Logs individuales de campos importantes
    context.log("🔥 [TestConnect] hub:", connectionContext.hub);
    context.log("🔥 [TestConnect] eventType:", connectionContext.eventType);
    context.log("🔥 [TestConnect] eventName:", connectionContext.eventName);
    context.log("🔥 [TestConnect] connectionId:", connectionContext.connectionId);
    context.log("🔥 [TestConnect] userId:", connectionContext.userId ?? "<undefined>");

    // Headers / claims si vienen
    if (connectionContext.headers) {
      context.log("🔥 [TestConnect] headers:", JSON.stringify(connectionContext.headers, null, 2));
    } else {
      context.log("🔥 [TestConnect] headers: <none>");
    }

    if (connectionContext.claims) {
      context.log("🔥 [TestConnect] claims:", JSON.stringify(connectionContext.claims, null, 2));
    } else {
      context.log("🔥 [TestConnect] claims: <none>");
    }

    // NO configuramos context.res para no interferir con el handshake.
    context.log("✅ [TestConnect] Finished without errors.");
  } catch (err: any) {
    context.log.error("💥 [TestConnect] ERROR:", err?.message || err);
    context.log.error("💥 [TestConnect] Full error object:", JSON.stringify(err, null, 2));

    // Tampoco tocamos context.res; dejamos que la extensión maneje respuesta.
  }
};

export default testConnect;
