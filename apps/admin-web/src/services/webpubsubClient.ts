import apiClient from './apiClient';
import {
  WebPubSubClient,
  WebPubSubJsonProtocol
} from '@azure/web-pubsub-client';

/**
 * Callback type invoked when a PubSub group message arrives.
 * @template T Type of the parsed message payload.
 * @param data Parsed JSON payload.
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

  /**
   * Fetches a client access token and endpoint from your API,
   * constructs a wss:// URL, initializes the client with JSON protocol,
   * starts the connection, and joins the user’s personal group.
   *
   * @param userEmail The normalized email to use as the group name.
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

    // 2) Convert https:// to wss:// and append access token
    const wssUrl = endpoint.replace(/^https?:\/\//, 'wss://');
    const clientUrl = `${wssUrl}/client/hubs/${hubName}` +
                      `?access_token=${encodeURIComponent(token)}`;

    // 3) Create the WebPubSubClient and assign it
    const wsClient = new WebPubSubClient(clientUrl, {
      protocol: WebPubSubJsonProtocol()
    });
    this.client = wsClient;

    // 4) Start the connection
    await wsClient.start();

    // 5) Join the personal group
    await wsClient.joinGroup(this.personalGroup);
  }

  /**
   * Joins an additional PubSub group on the same connection.
   *
   * @param groupName – normalized group name to join.
   */
  public async joinGroup(groupName: string): Promise<void> {
    if (!this.client) throw new Error('Not connected. Call connect() first.');
    await this.client.joinGroup(groupName.trim().toLowerCase());
  }

  /**
   * Leaves a previously joined PubSub group.
   *
   * @param groupName – normalized group name to leave.
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
   * @param handler Called with each parsed JSON message.
   * @template T Expected payload type.
   */
    public onMessage<T = unknown>(handler: MessageHandler<T>): void {
    if (!this.client) {
      throw new Error('Not connected. Call connect() first.');
    }

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
   * Registers a handler to be called when the connection closes.
   *
   * @param handler Called on connection-close.
   */
  public onDisconnected(handler: DisconnectHandler): void {
    if (!this.client) {
      throw new Error('Not connected. Call connect() first.');
    }
    this.client.on('disconnected', handler);
  }

  /**
   * Gracefully stops the client and clears internal state.
   */
  public disconnect(): void {
    if (this.client) {
      this.client.stop();
      this.client = undefined;
    }
  }
}
