/**
 * @fileoverview webPubSubErrorLogger - Utility for logging WebPubSub event errors
 * @summary Logs errors from WebPubSub event responses to the error log table
 * @description Provides a reusable function to log errors from WebSocket event responses
 * to the database error log table with appropriate severity and context.
 */

import { Context } from "@azure/functions";
import { ServiceContainer } from "../infrastructure/container/ServiceContainer";
import { IErrorLogService } from "../domain/interfaces/IErrorLogService";
import { ILogWebPubSubErrorOptions } from "../domain/interfaces/ILogWebPubSubErrorOptions";
import { ErrorSource } from "../domain/enums/ErrorSource";
import { ErrorSeverity } from "../domain/enums/ErrorSeverity";
import { ApiEndpoints } from "../domain/constants/ApiEndpoints";
import { FunctionNames } from "../domain/constants/FunctionNames";
import { WebSocketEventRequest, WebSocketEventResponse } from "../domain/value-objects";

/**
 * Logs an error to the database error log table if the response status indicates an error.
 *
 * @param response - WebSocket event response that may contain an error
 * @param request - WebSocket event request containing user and connection information
 * @param eventName - Name of the WebPubSub event (e.g., "connect", "connected", "disconnected")
 * @param serviceContainer - Service container instance for resolving dependencies
 * @param context - Azure Functions execution context for logging
 * @param options - Optional configuration for error logging
 */
export async function logWebPubSubErrorIfAny(
  response: WebSocketEventResponse,
  request: WebSocketEventRequest,
  eventName: string,
  serviceContainer: ServiceContainer,
  context: Context,
  options: ILogWebPubSubErrorOptions = {}
): Promise<void> {
  const {
    serviceName,
    endpoint = ApiEndpoints.WEBPUBSUB_EVENTS,
    functionName = FunctionNames.WEBPUBSUB_EVENTS
  } = options;

  if (response.status >= 400) {
    context.log.error(`${serviceName || "Service"} error`, {
      status: response.status,
      message: response.message,
      userId: request.userId
    });

    try {
      const errorLogService = serviceContainer.resolve<IErrorLogService>("ErrorLogService");
      
      await errorLogService.logError({
        severity: response.status >= 500 ? ErrorSeverity.Critical : ErrorSeverity.Medium,
        source: ErrorSource.WebPubSub,
        endpoint: endpoint,
        functionName: functionName,
        error: new Error(response.message),
        userId: request.userId,
        httpStatusCode: response.status,
        context: {
          eventName,
          connectionId: request.connectionId,
          hub: request.hub,
          phase: request.phase,
          ...(serviceName && { service: serviceName })
        }
      });
    } catch (logError) {
      context.log.warn("Failed to log error", logError);
    }
  }
}

