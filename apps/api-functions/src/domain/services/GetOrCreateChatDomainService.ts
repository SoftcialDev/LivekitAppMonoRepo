/**
 * @fileoverview GetOrCreateChatDomainService - Domain service for chat creation operations
 * @summary Handles chat creation business logic
 * @description Contains the core business logic for creating or getting chats
 */

import { GetOrCreateChatRequest } from "../value-objects/GetOrCreateChatRequest";
import { GetOrCreateChatResponse } from "../value-objects/GetOrCreateChatResponse";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IChatService } from "../interfaces/IChatService";
import { UserNotFoundError } from "../errors/UserErrors";

/**
 * Domain service for chat creation business logic
 * @description Handles the core business rules for creating or getting chats
 */
export class GetOrCreateChatDomainService {
  /**
   * Creates a new GetOrCreateChatDomainService instance
   * @param userRepository - Repository for user data access
   * @param chatService - Service for chat operations
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly chatService: IChatService
  ) {}

  /**
   * Creates or gets a chat between caller and PSO
   * @param request - The chat creation request
   * @param token - Authentication token for chat operations
   * @returns Promise that resolves to the chat creation response
   * @throws UserNotFoundError when caller or PSO not found
   * @example
   * const response = await getOrCreateChatDomainService.getOrCreateChat(request, token);
   */
  async getOrCreateChat(request: GetOrCreateChatRequest, token: string): Promise<GetOrCreateChatResponse> {
    // 1. Find caller by Azure AD Object ID
    const caller = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!caller || caller.deletedAt) {
      throw new UserNotFoundError(`Caller with ID ${request.callerId} not found or deleted`);
    }

    // 2. Find PSO by email
    const pso = await this.userRepository.findByEmail(request.psoEmail.toLowerCase());
    if (!pso || pso.deletedAt) {
      throw new UserNotFoundError(`PSO with email ${request.psoEmail} not found or deleted`);
    }

    // 3. Build the topic dynamically
    const topic = `InContactApp – ${caller.fullName} & ${pso.fullName}`;

    // 4. Create participants array
    const participants = [
      { userId: caller.id, azureAdObjectId: caller.azureAdObjectId },
      { userId: pso.id, azureAdObjectId: pso.azureAdObjectId },
    ];

    // 5. Get or create chat
    const chatId = await this.chatService.getOrSyncChat(token, participants, topic);

    return new GetOrCreateChatResponse(chatId);
  }
}
