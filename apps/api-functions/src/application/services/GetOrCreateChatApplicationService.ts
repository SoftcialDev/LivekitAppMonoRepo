/**
 * @fileoverview GetOrCreateChatApplicationService - Application service for chat creation operations
 * @summary Orchestrates chat creation operations
 * @description Handles orchestration of domain services for chat creation operations
 */

import { GetOrCreateChatRequest } from '../../domain/value-objects/GetOrCreateChatRequest';
import { GetOrCreateChatResponse } from '../../domain/value-objects/GetOrCreateChatResponse';
import { GetOrCreateChatDomainService } from '../../domain/services/GetOrCreateChatDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';

/**
 * Application service for handling chat creation operations
 * @description Orchestrates domain services for chat creation
 */
export class GetOrCreateChatApplicationService {
  /**
   * Creates a new GetOrCreateChatApplicationService instance
   * @param getOrCreateChatDomainService - Domain service for chat creation business logic
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly getOrCreateChatDomainService: GetOrCreateChatDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Creates or gets a chat between caller and PSO
   * @param callerId - The ID of the user making the request
   * @param request - The chat creation request
   * @param token - Authentication token for chat operations
   * @returns Promise that resolves to the chat creation response
   * @throws Error when caller is not authorized or chat creation fails
   * @example
   * const response = await getOrCreateChatApplicationService.getOrCreateChat(callerId, request, token);
   */
  async getOrCreateChat(callerId: string, request: GetOrCreateChatRequest, token: string): Promise<GetOrCreateChatResponse> {
    // All authenticated users can create chats
    await this.authorizationService.authorizeUserQuery(callerId);

    return await this.getOrCreateChatDomainService.getOrCreateChat(request, token);
  }
}
