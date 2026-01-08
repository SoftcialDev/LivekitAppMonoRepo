/**
 * @fileoverview TransferPsosApplicationService - Application service for PSO transfer operations
 * @summary Orchestrates PSO transfer operations
 * @description Handles orchestration of domain services for PSO transfer operations
 */

import { TransferPsosRequest } from '../../domain/value-objects/TransferPsosRequest';
import { TransferPsosResponse } from '../../domain/value-objects/TransferPsosResponse';
import { TransferPsosDomainService } from '../../domain/services/TransferPsosDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { UserRole } from '@prisma/client';

/**
 * Application service for handling PSO transfer operations
 * @description Orchestrates domain services for PSO transfers
 */
export class TransferPsosApplicationService {
  /**
   * Creates a new TransferPsosApplicationService instance
   * @param transferPsosDomainService - Domain service for PSO transfer business logic
   * @param authorizationService - Authorization service for permission checks
   */
  constructor(
    private readonly transferPsosDomainService: TransferPsosDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Transfers PSOs from the caller to a new supervisor
   * @param callerId - The ID of the user making the request
   * @param request - The PSO transfer request
   * @returns Promise that resolves to the PSO transfer response
   * @throws Error when caller is not authorized or transfer fails
   * @example
   * const response = await transferPsosApplicationService.transferPsos(callerId, request);
   */
  async transferPsos(callerId: string, request: TransferPsosRequest): Promise<TransferPsosResponse> {
    // Only Supervisors can transfer PSOs - use existing authorization method
    await this.authorizationService.authorizeUserQuery(callerId);

    return await this.transferPsosDomainService.transferPsos(request);
  }
}
