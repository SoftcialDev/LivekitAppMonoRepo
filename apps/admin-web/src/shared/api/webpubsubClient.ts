import apiClient from "./apiClient";
import {
  WebPubSubClient,
  WebPubSubJsonProtocol,
} from "@azure/web-pubsub-client";

/**
 * Callback type invoked when a PubSub group message arrives.
 * @template T - Type of the parsed message payload.
 * @param data - Parsed JSON payload.
 */
export type MessageHandler<T = unknown> = (data: T) => void;

/**
 * Callback type invoked when the Web PubSub connection closes.
 */
export type DisconnectHandler = () => void;

/**
 * Manages an Azure Web PubSub connection, group subscriptions, and resilient reconnection.
 *
 * @remarks
 * - Fetches a fresh access token for each connection attempt.
 * - Automatically re-joins the user’s personal group and the `"presence"` group on every connect/reconnect.
 * - Implements exponential backoff with jitter for reconnection attempts.
 * - Provides lifecycle hooks for `connected` and `disconnected` events.
 */
export class WebPubSubClientService {
  private client?: WebPubSubClient;
  private hubName!: string;
  private personalGroup!: string;
  private connected = false;

  // Reconnect state
  private shouldReconnect = false;
  private reconnectTimer: any = null;
  private backoffMs = 1000; // initial backoff
  private readonly maxBackoffMs = 30_000; // cap backoff

  /**
   * Returns true when the client is connected and has an active WebSocket instance.
   */
  public isConnected(): boolean {
    return this.connected && !!this.client;
  }

  /**
   * Ensures there is a live connection. If disconnected and auto-reconnect is enabled,
   * schedules an immediate reconnect attempt.
   *
   * @returns Promise that resolves after scheduling an immediate reconnect if needed.
   */
  public async ensureConnected(): Promise<void> {
    if (!this.isConnected() && this.shouldReconnect) {
      this.scheduleReconnect("ensureConnected()", true);
    }
  }

  /**
   * Connects to Azure Web PubSub using a freshly-fetched token and sets the personal group name.
   * Auto-reconnect is enabled until {@link disconnect} is called.
   *
   * @param userEmail - Normalized email used as the personal group name.
   * @returns Promise that resolves after an initial connection attempt (success or scheduled retry).
   */
  public async connect(userEmail: string): Promise<void> {
    this.personalGroup = userEmail.trim().toLowerCase();
    this.shouldReconnect = true;

    try {
      await this.startFreshClient();
      this.resetBackoff();
    } catch (err) {
      this.connected = false;
      this.scheduleReconnect("initial connect failed");
    }

    if (typeof window !== "undefined") {
      const onOnline = () => {
        if (!this.isConnected() && this.shouldReconnect) {
          this.scheduleReconnect("online event", true);
        }
      };
      window.addEventListener("online", onOnline, { passive: true });
      // Optional: add a corresponding removeEventListener in a dispose() if needed by the caller.
    }
  }

  /**
   * Registers a handler to run on every `connected` event.
   *
   * @param handler - Invoked when the socket connects or reconnects.
   * @throws Error if called before {@link connect}.
   */
  public onConnected(handler: () => void): void {
    if (!this.client) throw new Error("Not connected. Call connect() first.");
    this.client.on("connected", () => {
      this.connected = true;
      handler();
    });
  }

  /**
   * Joins an additional PubSub group on the current connection.
   *
   * @param groupName - Group name to join; normalized to lowercase.
   * @throws Error if not currently connected.
   */
  public async joinGroup(groupName: string): Promise<void> {
    if (!this.client) throw new Error("Not connected. Call connect() first.");
    await this.client.joinGroup(groupName.trim().toLowerCase());
  }

  /**
   * Leaves a previously joined PubSub group.
   *
   * @param groupName - Group name to leave; normalized to lowercase.
   * @throws Error if not currently connected.
   */
  public async leaveGroup(groupName: string): Promise<void> {
    if (!this.client) throw new Error("Not connected. Call connect() first.");
    await this.client.leaveGroup(groupName.trim().toLowerCase());
  }

  /**
   * Registers a handler for incoming group messages. Safely parses JSON and guards
   * against handler exceptions so they do not crash the application.
   *
   * @template T - Expected payload type after JSON parsing.
   * @param handler - Callback invoked with each parsed message payload.
   * @throws Error if not currently connected.
   */
  public onMessage<T = unknown>(handler: MessageHandler<T>): void {
    if (!this.client) throw new Error("Not connected. Call connect() first.");

    this.client.on("group-message", (e) => {
      let text: string;
      const raw = e.message.data;

      if (typeof raw === "string") {
        text = raw;
      } else if (raw instanceof ArrayBuffer) {
        text = new TextDecoder().decode(raw);
      } else if (ArrayBuffer.isView(raw)) {
        text = new TextDecoder().decode(raw.buffer as ArrayBuffer);
      } else {
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return;
      }

      try {
        handler(parsed as T);
      } catch {
        // swallow handler errors to avoid breaking the WS loop
      }
    });
  }

  /**
   * Registers a handler that fires when the connection closes unexpectedly.
   *
   * @param handler - Called on connection close.
   * @throws Error if not currently connected.
   */
  public onDisconnected(handler: DisconnectHandler): void {
    if (!this.client) throw new Error("Not connected. Call connect() first.");
    this.client.on("disconnected", () => {
      this.connected = false;
      handler();
    });
  }

  /**
   * Gracefully stops the client and disables auto-reconnect.
   * After calling this, the instance will not attempt to reconnect
   * until {@link connect} is invoked again.
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.client) {
      try {
        this.client.stop();
      } catch {
        // no-op
      }
      this.client = undefined;
    }
    this.connected = false;
  }

  /**
   * Creates a new WebSocket client with a fresh token and attaches lifecycle handlers.
   * Re-joins required groups on every (re)connection.
   *
   * @returns Promise that resolves after the client starts and required groups are joined.
   * @throws Error if token acquisition or client start fails.
   */
  private async startFreshClient(): Promise<void> {
    if (this.client) {
      try {
        this.client.stop();
      } catch {
        // no-op
      }
      this.client = undefined;
    }

    const { data } = await apiClient.get<{
      token: string;
      endpoint: string;
      hubName: string;
    }>("/api/WebPubSubToken");

    const { token, endpoint, hubName } = data;
    this.hubName = hubName;

    const wssUrl = endpoint.replace(/^https?:\/\//, "wss://");
    const clientUrl = `${wssUrl}/client/hubs/${hubName}?access_token=${encodeURIComponent(
      token
    )}`;

    const wsClient = new WebPubSubClient(clientUrl, {
      protocol: WebPubSubJsonProtocol(),
    });
    this.client = wsClient;

    wsClient.on("connected", async () => {
      this.connected = true;
      this.clearReconnectTimer();
      this.resetBackoff();
      await wsClient.joinGroup(this.personalGroup);
      await wsClient.joinGroup("presence");
    });

    wsClient.on("disconnected", () => {
      this.connected = false;
      if (this.shouldReconnect) {
        this.scheduleReconnect("ws disconnected");
      }
    });

    await wsClient.start();
    await wsClient.joinGroup(this.personalGroup);
    await wsClient.joinGroup("presence");

    this.connected = true;
  }

  /**
   * Schedules a reconnect attempt with exponential backoff and jitter.
   *
   * @param reason - Human-readable reason used for logging/diagnostics.
   * @param forcedImmediate - If true, attempts reconnect without delay.
   */
  private scheduleReconnect(reason: string, forcedImmediate = false): void {
    this.clearReconnectTimer();

    const jitter = Math.floor(Math.random() * 400);
    const delay = forcedImmediate
      ? 0
      : Math.min(this.backoffMs + jitter, this.maxBackoffMs);

    this.reconnectTimer = setTimeout(async () => {
      if (!this.shouldReconnect) return;
      try {
        await this.startFreshClient();
        this.resetBackoff();
      } catch {
        this.bumpBackoff();
        this.scheduleReconnect("reconnect failed");
      }
    }, delay);
  }

  /**
   * Resets the reconnect backoff to the initial value.
   */
  private resetBackoff(): void {
    this.backoffMs = 1000;
  }

  /**
   * Increases the reconnect backoff up to a maximum cap.
   */
  private bumpBackoff(): void {
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
  }

  /**
   * Clears any scheduled reconnect timer.
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
