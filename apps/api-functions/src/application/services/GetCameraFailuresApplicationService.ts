/**
 * @fileoverview GetCameraFailuresApplicationService - Application service for camera failure query operations
 * @summary Handles camera failure query application logic
 * @description Orchestrates camera failure query operations with authorization
 */

import { GetCameraFailuresDomainService } from '../../domain/services/GetCameraFailuresDomainService';
import { CameraFailureQueryParams, CameraStartFailure } from '../../domain/types/CameraFailureTypes';

/**
 * Application service for camera failure query operations
 * @description Orchestrates camera failure queries with authorization checks
 */
export class GetCameraFailuresApplicationService {
  /**
   * Creates a new GetCameraFailuresApplicationService instance
   * @param getCameraFailuresDomainService - Domain service for camera failure queries
   */
  constructor(
    private readonly getCameraFailuresDomainService: GetCameraFailuresDomainService
  ) {}

  /**
   * Retrieves camera failures matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an object with camera failures and total count
   * @throws Error if the query operation fails
   */
  async getCameraFailures(params?: CameraFailureQueryParams): Promise<{ failures: CameraStartFailure[]; total: number }> {
    const failures = await this.getCameraFailuresDomainService.getCameraFailures(params);
    const total = await this.getCameraFailuresDomainService.countCameraFailures(params);
    return { failures, total };
  }

  /**
   * Retrieves a single camera failure by its identifier
   * @param id - Camera failure identifier
   * @returns Promise that resolves to the camera failure record or null if not found
   * @throws Error if the query operation fails
   */
  async getCameraFailureById(id: string): Promise<CameraStartFailure | null> {
    return await this.getCameraFailuresDomainService.getCameraFailureById(id);
  }
}

