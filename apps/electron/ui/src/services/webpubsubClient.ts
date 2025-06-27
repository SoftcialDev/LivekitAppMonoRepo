import apiClient from './apiClient';
import {
  WebPubSubClient,
  WebPubSubJsonProtocol
} from '@azure/web-pubsub-client';

/**
 * Callback type invoked when a PubSub group message arrives.
 * @param data – Parsed JSON payload.
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
   * 1) Fetch { token, endpoint, hubName } from your API.
   * 2) Turn “https://…” → “wss://…”.
   * 3) Create a WebPubSubClient with the JSON sub-protocol.
   * 4) start() and joinGroup().
   *
   * @param userEmail – group name (normalized email).
   */
  public async connect(userEmail: string): Promise<void> {
    // Normalize and store groupName once
    this.groupName = userEmail.trim().toLowerCase();

    // 1) Fetch token + endpoint + hubName
    const { data } = await apiClient.get<{
      token: string;
      endpoint: string;
      hubName: string;
    }>('/api/WebPubSubToken');
    const { token, endpoint, hubName } = data;
    this.hubName = hubName;

    // 2) Build WebSocket URL
    const wss = endpoint.replace(/^https?:\/\//, 'wss://');
    const clientUrl = `${wss}/client/hubs/${hubName}` +
      `?access_token=${encodeURIComponent(token)}`;

    // 3) Initialize client with JSON protocol
    this.client = new WebPubSubClient(clientUrl, {
      protocol: WebPubSubJsonProtocol()
    });

    // 4) Start and join group
    await this.client.start();
    await this.client.joinGroup(this.groupName);
  }

  /**
   * Subscribe to incoming group messages.
   *
   * @param handler – invoked for each parsed JSON message.
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
        console.warn('Unsupported data type', raw);
        return;
      }

      try {
        handler(JSON.parse(text) as T);
      } catch (err) {
        console.error('JSON parse error:', err);
      }
    });
  }

  /**
   * Register a callback for when the WS connection closes.
   *
   * You can use this to trigger a fetch of pending commands on disconnect.
   */
  public onDisconnected(handler: DisconnectHandler): void {
    if (!this.client) throw new Error('Not connected. Call connect() first.');
    this.client.on('disconnected', handler);
  }

  /** Gracefully disconnect. */
  public disconnect(): void {
    this.client?.stop();
    this.client = undefined;
  }
}
