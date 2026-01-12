/**
 * @fileoverview SuperAdminApplicationService - Application service for Super Admin operations
 * @description Orchestrates Super Admin creation with authorization
 */

import { SuperAdminDomainService } from '../../domain/services/SuperAdminDomainService';
import { AuthorizationService } from '../../domain/services/AuthorizationService';
import { CreateSuperAdminRequest } from '../../domain/value-objects/CreateSuperAdminRequest';
import { DeleteSuperAdminRequest } from '../../domain/value-objects/DeleteSuperAdminRequest';
import { SuperAdminListResponse } from '../../domain/value-objects/SuperAdminListResponse';
import { SuperAdminProfile } from '../../domain/entities/SuperAdminProfile';  

/**
 * Application service for Super Admin operations.
 */
export class SuperAdminApplicationService {
  constructor(
    private readonly superAdminDomainService: SuperAdminDomainService,
    private readonly authorizationService: AuthorizationService
  ) {}

  /**
   * Creates a new Super Admin.
   * @param request - The Super Admin creation request
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves to the created Super Admin profile
   */
  async createSuperAdmin(
    request: CreateSuperAdminRequest,
    callerId: string
  ): Promise<SuperAdminProfile> {
    // Permission check is done at middleware level
    return await this.superAdminDomainService.createSuperAdmin(request);
  }

  /**
   * Deletes a Super Admin.
   * @param request - The Super Admin deletion request
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves when deletion is complete
   */
  async deleteSuperAdmin(
    request: DeleteSuperAdminRequest,
    callerId: string
  ): Promise<void> {
    // Permission check is done at middleware level
    await this.superAdminDomainService.deleteSuperAdmin(request);
  }

  /**
   * Lists Super Admins with proper authorization.
   * @param callerId - The ID of the user making the request
   * @returns Promise that resolves to the list of Super Admins
   */
  async listSuperAdmins(callerId: string): Promise<SuperAdminListResponse> {
    await this.authorizationService.canAccessSuperAdmin(callerId);
    
    return await this.superAdminDomainService.listSuperAdmins();
  }
}
