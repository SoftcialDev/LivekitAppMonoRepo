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
    // Instantiate only once
    const svc = new WebPubSubClientService();
    clientRef.current = svc;

    (async () => {
      try {
        // Starts the WS and auto-joins both groups (token claim).
        await svc.connect(currentEmail);

        svc.onMessage<PresenceMsg>((msg) => {
          if (msg.type !== "presence") return;

          const u = msg.user;
          onPresence(
            {
              email: u.email,
              fullName: u.fullName,
              name: u.fullName,
              azureAdObjectId: null,
              status: u.status,
              lastSeenAt: u.lastSeenAt,
            },
            u.status
          );
        });
      } catch (err) {
        console.error("[WS presence] connection failed", err);
      }
    })();

    // Cleanup when the component unmounts
    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [currentEmail, onPresence]);
}
