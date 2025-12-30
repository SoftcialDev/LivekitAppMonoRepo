/**
 * @fileoverview GetCameraFailuresDomainService - Domain service for camera failure query operations
 * @summary Handles camera failure query domain logic
 * @description Provides domain-level operations for querying camera failures
 */

import { ICameraStartFailureRepository } from '../interfaces/ICameraStartFailureRepository';
import { CameraFailureQueryParams } from '../interfaces/ICameraStartFailureRepository';

/**
 * Domain service for camera failure query operations
 * @description Provides domain-level operations for querying camera failures
 */
export class GetCameraFailuresDomainService {
  /**
   * Creates a new GetCameraFailuresDomainService instance
   * @param repository - Repository for camera failure data access
   */
  constructor(
    private readonly repository: ICameraStartFailureRepository
  ) {}

  /**
   * Retrieves camera failures matching the specified query parameters
   * @param params - Query parameters for filtering and pagination
   * @returns Promise that resolves to an array of camera failure records
   * @throws Error if the query operation fails
   */
  async getCameraFailures(params?: CameraFailureQueryParams): Promise<any[]> {
    try {
      return await this.repository.list(params);
    } catch (error) {
      throw new Error(`Failed to retrieve camera failures: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieves a single camera failure by its identifier
   * @param id - Camera failure identifier
   * @returns Promise that resolves to the camera failure record or null if not found
   * @throws Error if the query operation fails
   */
  async getCameraFailureById(id: string): Promise<any | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new Error(`Failed to retrieve camera failure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Counts camera failures matching the specified query parameters
   * @param params - Query parameters for filtering
   * @returns Promise that resolves to the total count
   * @throws Error if the count operation fails
   */
  async countCameraFailures(params?: CameraFailureQueryParams): Promise<number> {
    try {
      return await this.repository.count(params);
    } catch (error) {
      throw new Error(`Failed to count camera failures: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

