import apiClient from './apiClient';
import {
  WebPubSubClient,
  WebPubSubJsonProtocol
} from '@azure/web-pubsub-client';

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
 * Manages an Azure Web PubSub connection and group subscriptions.
 */
export class WebPubSubClientService {
  private client?: WebPubSubClient;
  private hubName!: string;
  private personalGroup!: string;
  private connected = false;

  /**
   * Returns true if the Web PubSub client is currently connected.
   */
  public isConnected(): boolean {
    return this.connected && !!this.client;
  }

  /**
   * Fetches an access token and endpoint, opens a WebSocket,
   * and joins both the user’s personal group and the "presence" group.
   *
   * Automatically re‑joins both groups on any subsequent reconnection.
   *
   * @param userEmail - The normalized email to use as the personal group name.
   * @throws Error if the client fails to start.
   */
  public async connect(userEmail: string): Promise<void> {
    this.personalGroup = userEmail.trim().toLowerCase();

    // 1) Fetch token, endpoint, and hubName from backend
    const { data } = await apiClient.get<{
      token:    string;
      endpoint: string;
      hubName:  string;
    }>('/api/WebPubSubToken');
    const { token, endpoint, hubName } = data;
    this.hubName = hubName;

    // 2) Build the WSS URL
    const wssUrl = endpoint.replace(/^https?:\/\//, 'wss://');
    const clientUrl = `${wssUrl}/client/hubs/${hubName}` +
                      `?access_token=${encodeURIComponent(token)}`;

    // 3) Instantiate and start the client
    const wsClient = new WebPubSubClient(clientUrl, {
      protocol: WebPubSubJsonProtocol()
    });
    this.client = wsClient;
    await wsClient.start();
    this.connected = true;

    // 4) Join required groups initially
    await wsClient.joinGroup(this.personalGroup);
    await wsClient.joinGroup('presence');

    // 5) On any automatic reconnect, re‑join both groups
    wsClient.on('connected', async () => {
      console.info('[WS] reconnected; re-joining groups');
      await wsClient.joinGroup(this.personalGroup);
      await wsClient.joinGroup('presence');
      this.connected = true;
    });

    // 6) Track disconnections
    wsClient.on('disconnected', () => {
      console.warn('[WS] disconnected');
      this.connected = false;
    });
  }

  /**
   * Joins an additional PubSub group on the same connection.
   *
   * @param groupName – Normalized group name to join.
   * @throws Error if not connected.
   */
  public async joinGroup(groupName: string): Promise<void> {
    if (!this.client) throw new Error('Not connected. Call connect() first.');
    await this.client.joinGroup(groupName.trim().toLowerCase());
  }

  /**
   * Leaves a previously joined PubSub group.
   *
   * @param groupName – Normalized group name to leave.
   * @throws Error if not connected.
   */
  public async leaveGroup(groupName: string): Promise<void> {
    if (!this.client) throw new Error('Not connected. Call connect() first.');
    await this.client.leaveGroup(groupName.trim().toLowerCase());
  }

  /**
   * Registers a handler for incoming group messages.
   * Any JSON parsing or handler errors are caught & logged
   * so they don’t crash your app.
   *
   * @param handler - Called with each parsed JSON message.
   * @template T - Expected payload type.
   * @throws Error if not connected.
   */
  public onMessage<T = unknown>(handler: MessageHandler<T>): void {
    if (!this.client) throw new Error('Not connected. Call connect() first.');

    this.client.on('group-message', e => {
      let text: string;
      const raw = e.message.data;

      if (typeof raw === 'string') {
        text = raw;
      } else if (raw instanceof ArrayBuffer) {
        text = new TextDecoder().decode(raw);
      } else if (ArrayBuffer.isView(raw)) {
        text = new TextDecoder().decode(raw.buffer as ArrayBuffer);
      } else {
        console.warn('Unsupported data type in group-message:', raw);
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse JSON message:', err);
        return;
      }

      try {
        handler(parsed as T);
      } catch (err) {
        console.error('Message handler threw an error:', err);
      }
    });
  }

  /**
   * Registers a handler to be called when the connection closes unexpectedly.
   *
   * @param handler - Called on connection-close.
   * @throws Error if not connected.
   */
  public onDisconnected(handler: DisconnectHandler): void {
    if (!this.client) throw new Error('Not connected. Call connect() first.');
    this.client.on('disconnected', () => {
      this.connected = false;
      handler();
    });
  }

  /**
   * Gracefully stops the client, leaves all groups, and clears internal state.
   */
  public disconnect(): void {
    if (this.client) {
      this.client.stop();
      this.client = undefined;
    }
    this.connected = false;
  }
}
