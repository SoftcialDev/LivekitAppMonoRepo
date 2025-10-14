/**
 * @fileoverview WebSocketEventRequest - Value object for WebSocket event requests
 * @summary Encapsulates WebSocket event request data
 * @description Value object representing a WebSocket connection/disconnection event
 */

/**
 * Value object representing a WebSocket event request
 * @description Encapsulates the user ID and event type for WebSocket events
 */
export class WebSocketEventRequest {
  /**
   * Creates a new WebSocketEventRequest instance
   * @param userId - The ID of the user involved in the event
   * @param eventType - The type of event (connected/disconnected)
   * @param phase - The phase of the event
   */
  constructor(
    public readonly userId: string,
    public readonly eventType: string,
    public readonly phase: string
  ) {}

  /**
   * Creates a WebSocketEventRequest from Azure Functions context
   * @param context - Azure Functions execution context
   * @returns WebSocketEventRequest instance
   */
  static fromContext(context: any): WebSocketEventRequest {
    const connectionContext = context.bindingData.connectionContext as Record<string, any>;
    const userId = connectionContext.userId as string;
    const eventType = connectionContext.eventType || connectionContext.eventName || '';
    const phase = eventType.toLowerCase();

    return new WebSocketEventRequest(userId, eventType, phase);
  }
}
