/**
 * @fileoverview WebSocketEventRequest - Value object for WebSocket event requests
 * @summary Encapsulates WebSocket event request data
 * @description Value object representing a WebSocket connection/disconnection event
 */

import { Context } from "@azure/functions";

export type WebSocketPhase = "connect" | "connected" | "disconnected" | "user" | "";

/**
 * Value object representing a WebSocket event request
 * @description Encapsulates the user ID, connection ID, hub, phase, and raw data for WebSocket events
 */
export class WebSocketEventRequest {
  /**
   * Creates a new WebSocketEventRequest instance
   * @param userId - The ID of the user involved in the event
   * @param connectionId - The connection ID for the WebSocket
   * @param hub - The hub name
   * @param phase - The phase of the event
   * @param raw - Raw connection context data
   */
  constructor(
    public readonly userId: string,
    public readonly connectionId: string,
    public readonly hub: string,
    public readonly phase: WebSocketPhase,
    public readonly raw: Record<string, any>
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a WebSocketEventRequest from Azure Functions context
   * @param ctx - Azure Functions execution context
   * @returns WebSocketEventRequest instance
   * @description Normalizes GA vs Preview payloads and always yields userId + phase
   */
  static fromContext(ctx: Context): WebSocketEventRequest {
    const c = (ctx.bindingData?.connectionContext ?? {}) as Record<string, any>;

    // Normalize GA vs Preview
    // GA:    eventType="System", eventName="connect|connected|disconnected"
    // Prev:  eventType="connect|connected|disconnected|user", eventName="system"
    const et = String(c.eventType ?? "").toLowerCase();
    const en = String(c.eventName ?? "").toLowerCase();
    const phase: WebSocketPhase =
      et === "system" || et === "" ? (en as WebSocketPhase) : (et as WebSocketPhase);

    // userId might be in multiple places depending on path
    const userId = String(c.userId ?? c.user?.id ?? c.claims?.userId ?? "").trim().toLowerCase();
    const connectionId = String(c.connectionId ?? "");
    const hub = String(c.hub ?? "");

    return new WebSocketEventRequest(userId, connectionId, hub, phase, c);
  }
}
