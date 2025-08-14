import apiClient from "./apiClient";
import {
  WebPubSubClient,
  WebPubSubJsonProtocol,
} from "@azure/web-pubsub-client";

/**
 * Shape returned by your negotiate endpoint.
 */
interface NegotiateResponse {
  /** JWT or SAS token for client access (already audience-scoped). */
  token: string;
  /** Service endpoint, e.g. https://<res>.webpubsub.azure.com */
  endpoint: string;
  /** Hub to connect to (used to compose the client URL). */
  hubName: string;
}

/**
 * Callback invoked when a message arrives (already JSON-parsed).
 * @template T Payload type
 */
export type MessageHandler<T = unknown> = (data: T) => void;

/**
 * Callback invoked on connection lifecycle transitions.
 */
export type VoidHandler = () => void;

/**
 * A resilient, app-wide singleton wrapper for Azure Web PubSub client sockets.
 *
 * ## Key features
 * - **Singleton**: one socket per app; multiple hooks/components can subscribe.
 * - **Multi-listener fan-out**: supports many `onMessage`/`onConnected`/`onDisconnected`
 *   listeners without overwriting each other. Returns **unsubscribe** functions.
 * - **Idempotent connect**: repeated `connect(email)` is safe; concurrent calls coalesce.
 * - **Group memory**: every `joinGroup()` is remembered and automatically rejoined
 *   on **every** reconnect, including custom groups (e.g., `commands:<email>`, `cm-status-updates`).
 * - **Exponential backoff** with jitter for reconnect attempts.
 * - **Online event** handling is installed **once** and removed on `disconnect()`.
 * - **Clean parsing** of text/ArrayBuffer messages and robust error isolation.
 */
export class WebPubSubClientService {
  // === Connection state ===
  private client?: WebPubSubClient;
  private currentUserEmail: string | null = null;
  private hubName: string | null = null;

  /** True while the socket is open and authenticated. */
  private connected = false;
  /** True while a connect() is in progress. Used to coalesce concurrent calls. */
  private connecting = false;
  /** Promise shared by concurrent connect() callers (idempotent connect). */
  private connectPromise: Promise<void> | null = null;

  // === Auto-reconnect state ===
  private shouldReconnect = false;
  private reconnectTimer: any = null;
  private backoffMs = 1000;            // initial backoff
  private readonly maxBackoffMs = 30_000;

  // === Group memory (rejoin on every connect) ===
  private joinedGroups = new Set<string>();

  // === App-level listener registries (persist across client recreation) ===
  private messageHandlers = new Set<MessageHandler<any>>();
  private connectedHandlers = new Set<VoidHandler>();
  private disconnectedHandlers = new Set<VoidHandler>();

  // === Global "online" listener ref (so we can uninstall it) ===
  private onlineListener?: () => void;

  /**
   * Returns whether the underlying socket is currently connected.
   */
  public isConnected(): boolean {
    return this.connected && !!this.client;
  }

  /**
   * Connects (or ensures a connection) for a given user email.
   *
   * - **Idempotent**: if already connected/connecting for the same email, returns the
   *   existing promise.
   * - **Switch user**: if you pass a different email than the active one, the client
   *   disconnects, clears groups, and connects fresh.
   *
   * Auto-reconnect remains enabled until you call {@link disconnect}.
   *
   * @param userEmail Normalized email identifying the client connection
   */
  public async connect(userEmail: string): Promise<void> {
    const email = userEmail.trim().toLowerCase();

    // Switch user scenario
    if (this.currentUserEmail && this.currentUserEmail !== email) {
      this.disconnect();                 // clean state
      this.joinedGroups.clear();         // do not leak previous user's groups
    }

    // Idempotent connect coalescing
    if (this.connecting && this.currentUserEmail === email && this.connectPromise) {
      return this.connectPromise;
    }
    if (this.connected && this.currentUserEmail === email) {
      // Already connected for this identity
      return;
    }

    this.currentUserEmail = email;
    this.shouldReconnect = true;

    // Ensure default groups are always present (they will be joined on 'connected')
    this.joinedGroups.add(email);        // "personal group"
    this.joinedGroups.add("presence");

    this.connecting = true;
    this.connectPromise = (async () => {
      try {
        await this.startFreshClient();   // creates client, hooks events, and starts
        this.resetBackoff();
      } catch (err) {
        // First connection failed → schedule retry
        this.connected = false;
        this.scheduleReconnect("initial connect failed");
        throw err;
      } finally {
        this.connecting = false;
      }
    })();

    // Install a single 'online' handler (first connect only)
    if (typeof window !== "undefined" && !this.onlineListener) {
      this.onlineListener = () => {
        if (!this.isConnected() && this.shouldReconnect) {
          this.scheduleReconnect("online event", true);
        }
      };
      window.addEventListener("online", this.onlineListener, { passive: true });
    }

    return this.connectPromise;
  }

  /**
   * Explicitly triggers a reconnect using the current identity and remembered groups.
   * Safe to call even if connected; the client will be recreated.
   */
  public async reconnect(): Promise<void> {
    if (!this.currentUserEmail) return;
    this.scheduleReconnect("explicit reconnect", true);
  }

  /**
   * Gracefully stops the client, disables auto-reconnect, removes global handlers,
   * and clears the socket reference. Listener registries remain intact so you can
   * `connect()` again and keep your subscriptions.
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();

    if (this.onlineListener) {
      window.removeEventListener("online", this.onlineListener);
      this.onlineListener = undefined;
    }

    if (this.client) {
      try { this.client.stop(); } catch { /* no-op */ }
      this.client = undefined;
    }

    this.connected = false;
    this.connecting = false;
    this.connectPromise = null;
  }

  /**
   * Joins a PubSub group **and remembers it** for automatic rejoin on future reconnects.
   * Calling this more than once for the same group is harmless.
   *
   * @param groupName Group name to join; normalized to lowercase
   */
  public async joinGroup(groupName: string): Promise<void> {
    const g = groupName.trim().toLowerCase();
    this.joinedGroups.add(g);
    if (!this.client) return; // Will be joined after connect
    await this.client.joinGroup(g);
  }

  /**
   * Leaves a PubSub group and removes it from the rejoin memory.
   *
   * @param groupName Group name to leave; normalized to lowercase
   */
  public async leaveGroup(groupName: string): Promise<void> {
    const g = groupName.trim().toLowerCase();
    this.joinedGroups.delete(g);
    if (!this.client) return;
    await this.client.leaveGroup(g);
  }

  /**
   * Registers a message handler that will receive **all** group/server messages
   * for this socket. You should **filter by your channel/group marker**
   * inside the payload (e.g., `msg.channel === "cm-status-updates"`).
   *
   * The handler persists across reconnects and client recreation.
   *
   * @param handler Function invoked with each JSON-parsed message payload
   * @returns Unsubscribe function
   */
  public onMessage<T = unknown>(handler: MessageHandler<T>): () => void {
    this.messageHandlers.add(handler as MessageHandler<any>);
    return () => this.messageHandlers.delete(handler as MessageHandler<any>);
  }

  /**
   * Registers a callback for the "connected" lifecycle event.
   * The handler persists across reconnects and client recreation.
   *
   * @param handler Callback invoked after a successful (re)connection
   * @returns Unsubscribe function
   */
  public onConnected(handler: VoidHandler): () => void {
    this.connectedHandlers.add(handler);
    return () => this.connectedHandlers.delete(handler);
  }

  /**
   * Registers a callback for the "disconnected" lifecycle event.
   * The handler persists across reconnects and client recreation.
   *
   * @param handler Callback invoked when the socket disconnects
   * @returns Unsubscribe function
   */
  public onDisconnected(handler: VoidHandler): () => void {
    this.disconnectedHandlers.add(handler);
    return () => this.disconnectedHandlers.delete(handler);
  }

  // ------------------------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------------------------

  /**
   * Creates a fresh low-level client, wires internal bridges to app-level
   * handler registries, starts the connection, and performs group rejoin.
   *
   * @throws If negotiate/start fails
   */
  private async startFreshClient(): Promise<void> {
    // Stop previous client (if any)
    if (this.client) {
      try { this.client.stop(); } catch { /* no-op */ }
      this.client = undefined;
    }

    // Negotiate token/URL
    const { data } = await apiClient.get<NegotiateResponse>("/api/WebPubSubToken");
    const { token, endpoint, hubName } = data;
    this.hubName = hubName;

    const wssUrl = endpoint.replace(/^https?:\/\//, "wss://");
    const clientUrl = `${wssUrl}/client/hubs/${hubName}?access_token=${encodeURIComponent(token)}`;

    // Create client with JSON subprotocol
    const wsClient = new WebPubSubClient(clientUrl, {
      protocol: WebPubSubJsonProtocol(),
    });
    this.client = wsClient;

    // Bridge: messages → fan-out to app-level handlers (persist across client recreation)
    // NOTE: NoImplicitAny fix — annotate `e: any`
    wsClient.on("group-message", (e: any) => this.dispatchMessage(e));
    wsClient.on("server-message", (e: any) => this.dispatchMessage(e)); // ← replaces invalid "message"

    // Lifecycle: connected/disconnected → update flags, backoff, and fan-out
    wsClient.on("connected", async () => {
      this.connected = true;
      this.clearReconnectTimer();
      this.resetBackoff();

      // Ensure default groups exist in memory
      if (this.currentUserEmail) {
        this.joinedGroups.add(this.currentUserEmail);
      }
      this.joinedGroups.add("presence");

      // Re-join **all** remembered groups
      for (const g of this.joinedGroups) {
        try { await wsClient.joinGroup(g); } catch { /* swallow to avoid loop breaks */ }
      }

      // Notify external subscribers
      for (const h of this.connectedHandlers) {
        try { h(); } catch { /* isolate handler errors */ }
      }
    });

    wsClient.on("disconnected", () => {
      this.connected = false;

      for (const h of this.disconnectedHandlers) {
        try { h(); } catch { /* isolate handler errors */ }
      }

      if (this.shouldReconnect) {
        this.scheduleReconnect("ws disconnected");
      }
    });

    // Start the client (handshake). Control returns once the socket is ready.
    await wsClient.start();
  }

  /**
   * Parses an incoming event payload (string/ArrayBuffer) and fans it out
   * to all registered message handlers. Handler errors are isolated.
   */
  private dispatchMessage(e: any): void {
    // Azure events can surface as { message: { data } } or directly { data }.
    const raw = e?.message?.data ?? e?.data ?? e;
    let text: string | undefined;

    if (typeof raw === "string") {
      text = raw;
    } else if (raw instanceof ArrayBuffer) {
      text = new TextDecoder().decode(raw);
    } else if (ArrayBuffer.isView(raw)) {
      text = new TextDecoder().decode(raw.buffer as ArrayBuffer);
    } else {
      // Unknown payload type — ignore silently
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON messages are ignored
      return;
    }

    for (const h of this.messageHandlers) {
      try { h(parsed); } catch { /* isolate handler errors */ }
    }
  }

  /**
   * Schedules a reconnect attempt using exponential backoff plus jitter.
   *
   * @param reason Human-readable reason for diagnostics
   * @param immediate If true, attempts reconnect without delay
   */
  private scheduleReconnect(reason: string, immediate = false): void {
    this.clearReconnectTimer();

    const jitter = Math.floor(Math.random() * 400);
    const delay = immediate ? 0 : Math.min(this.backoffMs + jitter, this.maxBackoffMs);

    this.reconnectTimer = setTimeout(async () => {
      if (!this.shouldReconnect || !this.currentUserEmail) return;
      try {
        await this.startFreshClient();
        this.resetBackoff();
      } catch {
        this.bumpBackoff();
        this.scheduleReconnect("reconnect failed");
      }
    }, delay);
  }

  /** Resets the reconnect backoff to its initial value. */
  private resetBackoff(): void {
    this.backoffMs = 1000;
  }

  /** Increases the reconnect backoff up to a maximum cap. */
  private bumpBackoff(): void {
    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
  }

  /** Clears any scheduled reconnect timer. */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

/**
 * App-wide singleton instance.
 *
 * Import and reuse this instance everywhere instead of creating new clients:
 * `import { webPubSubClient as pubsub } from "@/shared/api/webpubsubClient"`
 */
export const webPubSubClient = new WebPubSubClientService();
