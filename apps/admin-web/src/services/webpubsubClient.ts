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
 * Manages an Azure Web PubSub connection and group subscription.
 */
export class WebPubSubClientService {
  private client?: WebPubSubClient;
  private hubName!: string;
  private groupName!: string;

  /**
   * Fetches a client access token and endpoint from your API,
   * constructs a wss:// URL, initializes the client with JSON protocol,
   * starts the connection, and joins the user-specific group.
   *
   * @param userEmail The normalized email to use as the group name.
   */
  public async connect(userEmail: string): Promise<void> {
    this.groupName = userEmail.trim().toLowerCase();

    // 1) Fetch token, endpoint, and hubName from backend
    const { data } = await apiClient.get<{
      token: string;
      endpoint: string;
      hubName: string;
    }>('/api/WebPubSubToken');
    const { token, endpoint, hubName } = data;
    this.hubName = hubName;

    // 2) Convert https:// to wss:// and append access token
    const wss = endpoint.replace(/^https?:\/\//, 'wss://');
    const clientUrl = `${wss}/client/hubs/${hubName}` +
                      `?access_token=${encodeURIComponent(token)}`;

    // 3) Initialize WebPubSubClient with JSON sub-protocol
    this.client = new WebPubSubClient(clientUrl, {
      protocol: WebPubSubJsonProtocol()
    });

    // 4) Start the connection and join the group
    await this.client.start();
    await this.client.joinGroup(this.groupName);
  }

  /**
   * Registers a handler for incoming group messages.
   * Throws if not connected.
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
        console.warn('Unsupported data type:', raw);
        return;
      }

      try {
        handler(JSON.parse(text) as T);
      } catch (err) {
        console.error('Failed to parse JSON message:', err);
      }
    });
  }

  /**
   * Registers a handler to be called when the connection closes.
   * Use this to react to disconnects (e.g. fetch pending commands).
   *
   * @param handler Called on connection-close.
   */
  public onDisconnected(handler: DisconnectHandler): void {
    if (!this.client) {
      throw new Error('Not connected. Call connect() first.');
    }
    // The SDK emits 'disconnected' when the socket closes.
    this.client.on('disconnected', handler);
  }

  /**
   * Gracefully stops the client and clears internal state.
   */
  public disconnect(): void {
    this.client?.stop();
    this.client = undefined;
  }
}
