/**
 * @fileoverview WebSocketEventResponse - Value object for WebSocket event responses
 * @summary Encapsulates WebSocket event response data
 * @description Value object representing the response after processing WebSocket events
 */

/**
 * Value object representing a WebSocket event response
 * @description Encapsulates the status and message for WebSocket event processing
 */
export class WebSocketEventResponse {
  /**
   * Creates a new WebSocketEventResponse instance
   * @param status - HTTP status code
   * @param message - Response message
   */
  constructor(
    public readonly status: number,
    public readonly message: string
  ) {}

  /**
   * Converts the response to a plain object for Azure Functions response
   * @returns Plain object representation of the response
   */
  toPayload() {
    return {
      status: this.status,
      message: this.message
    };
  }

  /**
   * Creates a success response
   * @param message - Success message
   * @returns WebSocketEventResponse instance
   */
  static success(message: string = "Event processed successfully"): WebSocketEventResponse {
    return new WebSocketEventResponse(200, message);
  }

  /**
   * Creates an error response
   * @param message - Error message
   * @param status - HTTP status code (default: 500)
   * @returns WebSocketEventResponse instance
   */
  static error(message: string, status: number = 500): WebSocketEventResponse {
    return new WebSocketEventResponse(status, message);
  }
}
