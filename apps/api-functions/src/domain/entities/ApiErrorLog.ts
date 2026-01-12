/**
 * @fileoverview ApiErrorLog - Domain entity for API error logging
 * @description Encapsulates API error log business logic and state management
 */

import { ErrorSeverity } from '../enums/ErrorSeverity';
import { ErrorSource } from '../enums/ErrorSource';

/**
 * Domain entity representing an API error log with business logic
 */
export class ApiErrorLog {
  public readonly id: string;
  public readonly severity: ErrorSeverity;
  public readonly source: ErrorSource;
  public readonly endpoint: string | null;
  public readonly functionName: string | null;
  public readonly errorName: string | null;
  public readonly errorMessage: string | null;
  public readonly stackTrace: string | null;
  public readonly httpStatusCode: number | null;
  public readonly userId: string | null;
  public readonly userEmail: string | null;
  public readonly requestId: string | null;
  public readonly context: Record<string, unknown> | null;
  public readonly resolved: boolean;
  public readonly resolvedAt: Date | null;
  public readonly resolvedBy: string | null;
  public readonly createdAt: Date;

  /**
   * Creates a new ApiErrorLog entity
   * @param props - ApiErrorLog properties
   */
  constructor(props: {
    id: string;
    severity: ErrorSeverity;
    source: ErrorSource;
    endpoint?: string | null;
    functionName?: string | null;
    errorName?: string | null;
    errorMessage?: string | null;
    stackTrace?: string | null;
    httpStatusCode?: number | null;
    userId?: string | null;
    userEmail?: string | null;
    requestId?: string | null;
    context?: Record<string, unknown> | null;
    resolved?: boolean;
    resolvedAt?: Date | null;
    resolvedBy?: string | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.severity = props.severity;
    this.source = props.source;
    this.endpoint = props.endpoint || null;
    this.functionName = props.functionName || null;
    this.errorName = props.errorName || null;
    this.errorMessage = props.errorMessage ?? null;
    this.stackTrace = props.stackTrace || null;
    this.httpStatusCode = props.httpStatusCode || null;
    this.userId = props.userId || null;
    this.userEmail = props.userEmail || null;
    this.requestId = props.requestId || null;
    this.context = props.context || null;
    this.resolved = props.resolved || false;
    this.resolvedAt = props.resolvedAt || null;
    this.resolvedBy = props.resolvedBy || null;
    this.createdAt = props.createdAt;
  }

  /**
   * Creates an ApiErrorLog entity from Prisma model
   * @param prismaErrorLog - Prisma ApiErrorLog model
   * @returns ApiErrorLog entity
   */
  static fromPrisma(prismaErrorLog: {
    id: string;
    severity: string;
    source: string;
    endpoint: string | null;
    functionName: string | null;
    errorName: string | null;
    errorMessage: string | null;
    stackTrace: string | null;
    httpStatusCode: number | null;
    userId: string | null;
    userEmail: string | null;
    requestId: string | null;
    context: Record<string, unknown> | null;
    resolved: boolean;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    createdAt: Date;
  }): ApiErrorLog {
    return new ApiErrorLog({
      id: prismaErrorLog.id,
      severity: prismaErrorLog.severity as ErrorSeverity,
      source: prismaErrorLog.source as ErrorSource,
      endpoint: prismaErrorLog.endpoint ?? null,
      functionName: prismaErrorLog.functionName,
      errorName: prismaErrorLog.errorName ?? null,
      errorMessage: prismaErrorLog.errorMessage ?? null,
      stackTrace: prismaErrorLog.stackTrace,
      httpStatusCode: prismaErrorLog.httpStatusCode,
      userId: prismaErrorLog.userId,
      userEmail: prismaErrorLog.userEmail,
      requestId: prismaErrorLog.requestId,
      context: prismaErrorLog.context,
      resolved: prismaErrorLog.resolved,
      resolvedAt: prismaErrorLog.resolvedAt,
      resolvedBy: prismaErrorLog.resolvedBy,
      createdAt: prismaErrorLog.createdAt
    });
  }

  /**
   * Checks if the error log is resolved
   * @returns True if the error log is resolved
   */
  isResolved(): boolean {
    return this.resolved;
  }

  /**
   * Checks if the error log is critical
   * @returns True if the error severity is Critical
   */
  isCritical(): boolean {
    return this.severity === ErrorSeverity.Critical;
  }

  /**
   * Checks if the error log is high severity
   * @returns True if the error severity is High or Critical
   */
  isHighSeverity(): boolean {
    return this.severity === ErrorSeverity.High || this.severity === ErrorSeverity.Critical;
  }

  /**
   * Gets the age of the error log in milliseconds
   * @returns Age in milliseconds
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Gets the age of the error log in minutes
   * @returns Age in minutes
   */
  getAgeInMinutes(): number {
    return Math.floor(this.getAge() / (1000 * 60));
  }

  /**
   * Checks if the error log is recent (within specified minutes)
   * @param maxMinutes - Maximum minutes to consider recent
   * @returns True if error log is recent
   */
  isRecent(maxMinutes: number = 60): boolean {
    return this.getAgeInMinutes() <= maxMinutes;
  }
}

