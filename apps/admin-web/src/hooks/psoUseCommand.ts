import { useEffect } from 'react';
import { WebPubSubClientService }        from '../services/webpubsubClient';
import { PendingCommandsClient, PendingCommand } from '../services/pendingCommandsClient';

/**
 * Subscribes to “START / STOP” messages on the Web-PubSub socket that is
 * already opened by **usePresence**, then replays any queued commands.
 *
 * @param userEmail              Lower-cased e-mail (group / user-id).
 * @param pubSubService          Shared, *already-connecting* instance.
 * @param pendingCommandsClient  Helper that talks to /api/PendingCommands.
 * @param handleCommand          Your async callback for each command.
 */
export function useCommands(
  userEmail: string,
  pubSubService: WebPubSubClientService,
  pendingCommandsClient: PendingCommandsClient,
  handleCommand: (cmd: PendingCommand) => Promise<void>
): void {
  useEffect(() => {
    if (!userEmail) return;
    let mounted = true;

    (async () => {
      /* ----------------------------------------------------------
       * 1)  Wait until `connect()` inside usePresence has finished.
       *     We *cannot* touch private members directly, so we access
       *     them through `any` – this silences TS while still keeping
       *     runtime safety.
       * -------------------------------------------------------- */
      const svcAny = pubSubService as any;
      while (mounted && !svcAny.client) {
        await new Promise(r => setTimeout(r, 100));   // 100 ms back-off
      }
      if (!mounted) return;

      /* ----------------------------------------------------------
       * 2)  Handle live, in-flight commands
       * -------------------------------------------------------- */
      pubSubService.onMessage(async raw => {
        if (!mounted) return;

        let cmd: PendingCommand;
        try {
          cmd = typeof raw === 'string' ? JSON.parse(raw) : (raw as PendingCommand);
        } catch {
          return;                    // silently drop malformed payloads
        }
        await handleCommand(cmd);
      });

      /* ----------------------------------------------------------
       * 3)  Replay anything that was queued
       * -------------------------------------------------------- */
      const missed = await pendingCommandsClient.fetch();
      for (const cmd of missed) {
        if (!mounted) break;
        await handleCommand(cmd);
      }
    })();

    // clean-up
    return () => { mounted = false; };
  }, [userEmail, pubSubService, pendingCommandsClient, handleCommand]);
}
