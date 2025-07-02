import { useEffect } from 'react';
import { WebPubSubClientService } from '../services/webpubsubClient';
import { PresenceClient }         from '../services/presenceClient';

/**
 * Marks the user **online** once the socket is _really_ connected and
 * guarantees we never register an `onDisconnected` handler on a client
 * that hasn’t been started yet (the root cause of the earlier
 * “Not connected. Call connect() first.” error).
 *
 * The hook is also now responsible for _owning_ the Web-PubSub
 * connection; every other hook should assume the socket is already up
 * and must **NOT** call `connect()` again.
 *
 * @param userEmail      Normalised e-mail that acts as both user-id and group.
 * @param pubSubService  A **single** shared instance for the whole page.
 * @param presenceClient Tiny helper that writes the `online/offline`
 *                       record back to your API/DB.
 */
export function usePresence(
  userEmail: string,
  pubSubService: WebPubSubClientService,
  presenceClient: PresenceClient
): void {
  useEffect(() => {
    if (!userEmail) return;

    let didConnect = false;
    let cleanupSocket = () => {};

    (async () => {
      // 1️⃣  Open the socket once
      await pubSubService.connect(userEmail);
      didConnect = true;

      // 2️⃣  Announce “online” only after the connection succeeds
      await presenceClient.setOnline();

      // 3️⃣  Now that we ARE connected, we can safely react to disconnects
      pubSubService.onDisconnected(async () => {
        if (didConnect) {
          await presenceClient.setOffline();
        }
      });

      // save so the outer cleanup can re-use it
      cleanupSocket = () => pubSubService.disconnect();
    })();

    // 4️⃣  Component unmount
    return () => {
      if (didConnect) {
        presenceClient.setOffline();
      }
      cleanupSocket();
    };
  }, [userEmail, pubSubService, presenceClient]);
}
