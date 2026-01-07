/**
 * @fileoverview GetCameraFailuresDomainService - Domain service for camera failure query operations
 * @summary Handles camera failure query domain logic
 * @description Provides domain-level operations for querying camera failures
 */

import { ICameraStartFailureRepository } from '../interfaces/ICameraStartFailureRepository';
import { CameraFailureQueryParams, CameraStartFailure } from '../types/CameraFailureTypes';
import { CameraFailureRetrieveError, CameraFailureCountError } from '../errors/CameraFailureErrors';

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
  async getCameraFailures(params?: CameraFailureQueryParams): Promise<CameraStartFailure[]> {
    try {
      return await this.repository.list(params);
    } catch (error) {
      throw new CameraFailureRetrieveError(`Failed to retrieve camera failures: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Retrieves a single camera failure by its identifier
   * @param id - Camera failure identifier
   * @returns Promise that resolves to the camera failure record or null if not found
   * @throws Error if the query operation fails
   */
  async getCameraFailureById(id: string): Promise<CameraStartFailure | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      throw new CameraFailureRetrieveError(`Failed to retrieve camera failure: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
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
      throw new CameraFailureCountError(`Failed to count camera failures: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error : undefined);
    }
  }
}

