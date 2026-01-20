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
 * Environment variable value details
 */
export interface EnvironmentVariableDetails {
  name: string;
  value?: string; // Valor completo (solo para super admin y variables permitidas)
  partialValue?: string; // Valor parcial para debug (mitad del valor)
  length?: number;
  exists: boolean;
  isRequestedVar?: boolean; // Si es la variable solicitada con ?envVar=
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
  allEnvironmentVariables?: Record<string, EnvironmentVariableDetails>; // Todas las variables de process.env
  requestedVariable?: string; // Variable solicitada con ?envVar=
  isSuperAdmin?: boolean; // Si el usuario es super admin
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
  environmentVariables?: Record<string, string | undefined>;
}

