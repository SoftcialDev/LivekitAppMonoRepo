/**
 * @fileoverview webPubSubEventLogger - Utility for logging WebPubSub events (connections/disconnections)
 * @summary Logs successful WebPubSub events to the error log table for monitoring
 * @description Provides a function to log connection and disconnection events to the database
 * for tracking and debugging purposes. Uses Low severity to indicate informational logs.
 */

import { Context } from "@azure/functions";
import { ServiceContainer } from "../infrastructure/container/ServiceContainer";
import { IErrorLogService } from "../domain/interfaces/IErrorLogService";
import { ErrorSource } from "../domain/enums/ErrorSource";
import { ErrorSeverity } from "../domain/enums/ErrorSeverity";
import { WebSocketEventRequest } from "../domain/value-objects";
import { ApiEndpoints } from "../domain/constants/ApiEndpoints";
import { FunctionNames } from "../domain/constants/FunctionNames";

/**
 * Logs a WebPubSub event (connection/disconnection) to the database for monitoring
 *
 * @param eventName - Name of the WebPubSub event (e.g., "connect", "connected", "disconnected")
 * @param request - WebSocket event request containing user and connection information
 * @param serviceContainer - Service container instance for resolving dependencies
 * @param context - Azure Functions execution context for logging
 * @param endpoint - Optional endpoint path (defaults to "/api/webpubsub-events")
 * @param functionName - Optional function name (defaults to "WebPubSubEvents")
 */
export async function logWebPubSubEvent(
  eventName: string,
  request: WebSocketEventRequest,
  serviceContainer: ServiceContainer,
  context: Context,
  endpoint: string = ApiEndpoints.WEBPUBSUB_EVENTS,
  functionName: string = FunctionNames.WEBPUBSUB_EVENTS
): Promise<void> {
  try {
    const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
    
    const eventType = eventName.toLowerCase();
    const isConnection = eventType === "connect" || eventType === "connected";
    const isDisconnection = eventType === "disconnected";
    
    if (!isConnection && !isDisconnection) {
      return;
    }
    
    const message = isConnection 
      ? `WebPubSub connection event: User ${request.userId || 'unknown'} connected (${eventName})`
      : `WebPubSub disconnection event: User ${request.userId || 'unknown'} disconnected`;
    
    await errorLogService.logError({
      severity: ErrorSeverity.Low,
      source: ErrorSource.WebPubSub,
      endpoint: endpoint,
      functionName: functionName,
      error: new Error(message),
      userId: request.userId,
      httpStatusCode: 200,
      context: {
        eventName,
        connectionId: request.connectionId,
        hub: request.hub,
        phase: request.phase,
        eventType: isConnection ? 'connection' : 'disconnection'
      }
    });
    
    context.log.info(`[WebPubSubEvent] Logged ${eventType} event for user: ${request.userId}`);
  } catch (logError) {
    context.log.warn(`[WebPubSubEvent] Failed to log event: ${logError instanceof Error ? logError.message : String(logError)}`);
  }
}


