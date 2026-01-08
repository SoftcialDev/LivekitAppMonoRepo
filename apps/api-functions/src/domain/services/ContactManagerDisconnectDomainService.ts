/**
 * @fileoverview ContactManagerDisconnectDomainService - Domain service for Contact Manager disconnect operations
 * @summary Handles Contact Manager disconnect business logic
 * @description Contains the core business logic for Contact Manager disconnection events
 */

import { WebSocketEventRequest } from "../value-objects/WebSocketEventRequest";
import { WebSocketEventResponse } from "../value-objects/WebSocketEventResponse";
import { ICommandMessagingService } from "../interfaces/ICommandMessagingService";
import { ContactManagerStatus } from "@prisma/client";
import prisma from '../../infrastructure/database/PrismaClientService';
import { extractErrorMessage } from '../../utils/error/ErrorHelpers';

/**
 * Domain service for Contact Manager disconnect business logic
 * @description Handles the core business rules for Contact Manager disconnection events
 */
export class ContactManagerDisconnectDomainService {
  /**
   * Creates a new ContactManagerDisconnectDomainService instance
   * @param commandMessagingService - Service for command messaging operations
   */
  constructor(
    private readonly commandMessagingService: ICommandMessagingService
  ) {}

  /**
   * Handles Contact Manager disconnection event
   * @param request - The WebSocket event request
   * @returns Promise that resolves to the WebSocket event response
   * @example
   * const response = await contactManagerDisconnectDomainService.handleContactManagerDisconnect(request);
   */
  async handleContactManagerDisconnect(request: WebSocketEventRequest): Promise<WebSocketEventResponse> {
    try {
      // Only process if this is a disconnection event
      if (request.phase !== "disconnected") {
        return WebSocketEventResponse.success("Not a disconnection event, skipping Contact Manager logic");
      }

      // 1. Check if this user is a Contact Manager
      const profile = await prisma.contactManagerProfile.findUnique({
        where: { userId: request.userId },
      });

      if (!profile) {
        return WebSocketEventResponse.success("User is not a Contact Manager, skipping Contact Manager logic");
      }

      // 2. Update Contact Manager status to Unavailable
      const updated = await prisma.contactManagerProfile.update({
        where: { userId: request.userId },
        data: { status: ContactManagerStatus.Unavailable },
      });

      // 3. Broadcast status update to employees
      await this.commandMessagingService.sendToGroup("cm-status-updates", {
        managerId: updated.userId,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      });
      
      return WebSocketEventResponse.success(`Contact Manager ${request.userId} status updated successfully`);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error);
      return WebSocketEventResponse.error(`Failed to handle Contact Manager disconnect: ${errorMessage}`);
    }
  }
}
