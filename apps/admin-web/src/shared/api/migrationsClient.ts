/**
 * @fileoverview migrationsClient.ts - API client for database migrations
 */

import apiClient from './apiClient';

export interface RunMigrationsResponse {
  success: boolean;
  message: string;
  timestamp: string;
  migrationStdout?: string;
  migrationStderr?: string;
  seedErrors?: string[];
  errors?: string[];
  error?: string;
}

/**
 * Runs database migrations and seeding
 * @returns Promise that resolves to migration response with all errors
 */
export async function runMigrations(): Promise<RunMigrationsResponse> {
  const response = await apiClient.post<RunMigrationsResponse>(
    '/api/RunMigrations',
    {}
  );
  return response.data;
}

