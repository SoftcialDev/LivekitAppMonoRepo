/**
 * @fileoverview HealthCheckTypes - Type definitions for health check responses
 * @summary Defines types and interfaces for health check endpoint responses
 * @description Encapsulates health check response data structures as types/interfaces
 */

import { HealthStatus } from '../enums/HealthStatus';

/**
 * Database connectivity check result
 */
export interface DatabaseCheck {
  status: HealthStatus;
  message: string;
  details?: unknown;
}

/**
 * Storage variable details for health check
 */
export interface StorageVariableDetails {
  exists: boolean;
  preview?: string;
  length?: number;
  isBase64?: boolean;
  base64Validation?: string;
  decodedLength?: number;
  warning?: string;
  source?: string;
  value?: string;
}

/**
 * Storage details for health check
 */
export interface StorageDetails {
  AZURE_STORAGE_ACCOUNT?: StorageVariableDetails;
  AZURE_STORAGE_KEY?: StorageVariableDetails;
  AZURE_STORAGE_CONNECTION_STRING?: StorageVariableDetails;
  RECORDINGS_CONTAINER_NAME?: StorageVariableDetails;
  SNAPSHOT_CONTAINER_NAME?: StorageVariableDetails;
  RESOLVED_ACCOUNT_KEY?: StorageVariableDetails;
  RESOLVED_ACCOUNT_NAME?: StorageVariableDetails;
}

/**
 * Environment variables check result
 */
export interface EnvCheck {
  status: HealthStatus;
  missingKeys: string[];
  presentKeys?: string[];
  storageDetails?: StorageDetails;
  error?: string;
}

/**
 * User information for health check response
 */
export interface HealthCheckUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  azureAdObjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Complete health check response payload
 */
export interface HealthCheckResponse {
  status: HealthStatus;
  timestamp: string;
  checks: {
    env: EnvCheck;
    database?: DatabaseCheck;
  };
  users?: HealthCheckUser[] | { error: string };
}

