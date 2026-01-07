/**
 * @fileoverview GetTalkSessionsDomainService.ts - Domain service for talk sessions query operations
 * @summary Handles talk sessions query business logic
 * @description Contains the core business logic for retrieving talk sessions with pagination
 */

import { GetTalkSessionsRequest } from "../value-objects/GetTalkSessionsRequest";
import { GetTalkSessionsResponse, TalkSessionDto } from "../value-objects/GetTalkSessionsResponse";
import { ITalkSessionRepository } from "../interfaces/ITalkSessionRepository";

/**
 * Domain service for talk sessions query business logic.
 * @description Handles the core business rules for retrieving talk sessions.
 */
export class GetTalkSessionsDomainService {
  /**
   * Creates a new GetTalkSessionsDomainService instance.
   * @param talkSessionRepository - Repository for talk session data access
   */
  constructor(
    private readonly talkSessionRepository: ITalkSessionRepository
  ) {}

  /**
   * Retrieves all talk sessions with pagination.
   * @param request - The talk sessions query request
   * @returns Promise that resolves to the talk sessions response
   */
  async getTalkSessions(request: GetTalkSessionsRequest): Promise<GetTalkSessionsResponse> {
    const { sessions, total } = await this.talkSessionRepository.getAllTalkSessionsWithRelations(
      request.page,
      request.limit
    );

    const sessionDtos: TalkSessionDto[] = sessions.map(s => ({
      id: s.id,
      supervisorId: s.supervisorId,
      supervisorName: s.supervisor.fullName,
      supervisorEmail: s.supervisor.email,
      psoId: s.psoId,
      psoName: s.pso.fullName,
      psoEmail: s.pso.email,
      startedAt: s.startedAt.toISOString(),
      stoppedAt: s.stoppedAt?.toISOString() || null,
      stopReason: s.stopReason,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    }));

    return GetTalkSessionsResponse.fromSessions(
      sessionDtos,
      total,
      request.page,
      request.limit
    );
  }
}

