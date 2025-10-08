import { useEffect, useRef } from "react";
import { WebPubSubClientService } from "../api/webpubsubClient";
import { UserStatus } from "../types/UserStatus";


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
    const svc = WebPubSubClientService.getInstance();
    clientRef.current = svc;

    (async () => {
      try {
        await svc.connect(currentEmail);

        // Si tu token incluye un grupo global "presence", lo habrás unido ya.
        // Si quieres unirte manualmente:
        try {
          await svc.joinGroup("presence");
        } catch (e) {
          // Could not join 'presence' group - silently continue
        }

        svc.onMessage<PresenceMsg>((msg: PresenceMsg) => {
          if (msg.type !== "presence") return;

          const u = msg.user;
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
        // Connection failed - silently continue
      }
    })();

    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [currentEmail, onPresence]);
}
