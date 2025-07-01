import { useEffect, useRef } from "react";
import type { UserStatus } from "../types/types";
import { WebPubSubClientService } from "../../../services/webpubsubClient";

/** Message shape broadcast from the backend */
interface PresenceMsg {
  type: "presence";
  user: {
    email: string;
    fullName: string;
    status: "online" | "offline";
    lastSeenAt: string;
  };
}

interface Options {
  /** E-mail of the *current* logged-in user (needed to build the token) */
  currentEmail: string;
  /**
   * Fired every time a coworker toggles status.
   * @param user   Parsed `UserStatus`
   * @param status `"online"` | `"offline"`
   */
  onPresence: (user: UserStatus, status: "online" | "offline") => void;
}

/**
 * Opens an Azure Web PubSub connection, already subscribed to:
 *  • the user's personal group  (`alice@corp.com`)
 *  • the global `presence` group (added by the token)
 *
 * Whenever the backend broadcasts `{ type:'presence', user:{…} }`
 * the `onPresence` callback is invoked with a ready-to-use UserStatus object.
 */
export function usePresenceWebSocket({ currentEmail, onPresence }: Options) {
  const clientRef = useRef<WebPubSubClientService | null>(null);

  useEffect(() => {
    console.log("[usePresenceWebSocket] initializing for", currentEmail);
    const svc = new WebPubSubClientService();
    clientRef.current = svc;

    (async () => {
      try {
        console.log("[usePresenceWebSocket] connecting as", currentEmail);
        await svc.connect(currentEmail);
        console.log("[usePresenceWebSocket] connected & joined personal group");

        // Si tu token incluye un grupo global "presence", lo habrás unido ya.
        // Si quieres unirte manualmente:
        try {
          await svc.joinGroup("presence");
          console.log("[usePresenceWebSocket] joined global 'presence' group");
        } catch (e) {
          console.warn("[usePresenceWebSocket] could not join 'presence' group", e);
        }

        svc.onMessage<PresenceMsg>((msg) => {
          console.log("[usePresenceWebSocket] raw message →", msg);
          if (msg.type !== "presence") return;

          const u = msg.user;
          console.log(
            `[usePresenceWebSocket] presence event for ${u.email}:`,
            u.status
          );
          onPresence(
            {
              email: u.email,
              fullName: u.fullName,
              name: u.fullName,
              azureAdObjectId: null,
              status: u.status,
            },
            u.status
          );
        });
      } catch (err) {
        console.error("[usePresenceWebSocket] connection failed", err);
      }
    })();

    return () => {
      console.log("[usePresenceWebSocket] tearing down for", currentEmail);
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [currentEmail, onPresence]);
}
