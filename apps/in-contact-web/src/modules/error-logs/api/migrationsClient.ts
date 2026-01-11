/**
 * @fileoverview migrationsClient - API client for database migrations
 * @summary Handles running database migrations and seeding
 * @description API client for executing database migrations and seeding operations.
 * Provides typed error handling and response structures.
 */

import apiClient from '@/shared/api/apiClient';
import { ApiError } from '@/shared/errors';
import { MigrationsRunError } from '../errors';
import { logError } from '@/shared/utils/logger';
import type { RunMigrationsResponse } from '../types/errorLogsTypes';

/**
 * Runs database migrations and seeding
 * 
 * Executes database migrations and permission seeding operations.
 * This operation updates the database schema and seeds permissions.
 * 
 * @returns Promise that resolves to migration response with success status and messages
 * @throws {MigrationsRunError} if the migration operation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await runMigrations();
 *   if (result.success) {
 *     showToast('Migrations completed successfully', 'success');
 *   }
 * } catch (error) {
 *   if (error instanceof MigrationsRunError) {
 *     showToast(error.message, 'error');
 *   }
 * }
 * ```
 */
export async function runMigrations(): Promise<RunMigrationsResponse> {
  try {
    const response = await apiClient.post<RunMigrationsResponse>(
      '/api/RunMigrations',
      {}
    );
    return response.data;
  } catch (error: unknown) {
    logError('Failed to run migrations', { error });
    
    if (error instanceof ApiError) {
      throw new MigrationsRunError(error.message, error);
    }
    
    if (error instanceof Error) {
      throw new MigrationsRunError('Failed to run database migrations', error);
    }
    
    throw new MigrationsRunError('Failed to run database migrations');
  }
}

