/**
 * @fileoverview Camera Command API client
 * @summary API client for camera control commands
 * @description Client for sending camera control commands to the backend
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import { CameraCommandError } from '../errors';

/**
 * Client for sending camera control commands to the backend.
 */
export class CameraCommandClient {
  private readonly endpoint = '/api/CamaraCommand';

  /**
   * Instruct the backend to start streaming for this PSO.
   * @param employeeEmail - PSO's email (used as group name).
   * @throws {CameraCommandError} If the command fails
   */
  public async start(employeeEmail: string): Promise<void> {
    await this.send('START', employeeEmail);
  }

  /**
   * Instruct the backend to stop streaming for this PSO.
   * @param employeeEmail - PSO's email.
   * @param reason - Optional reason for stopping the stream.
   * @throws {CameraCommandError} If the command fails
   */
  public async stop(employeeEmail: string, reason?: string): Promise<void> {
    await this.send('STOP', employeeEmail, reason);
  }

  /**
   * Instruct the backend to send a refresh command to this PSO.
   * @param employeeEmail - PSO's email.
   * @throws {CameraCommandError} If the command fails
   */
  public async refresh(employeeEmail: string): Promise<void> {
    await this.send('REFRESH', employeeEmail);
  }

  /**
   * Send a camera command with timestamp.
   * @param command - Command type (START, STOP, or REFRESH)
   * @param employeeEmail - PSO's email address
   * @param reason - Optional reason for the command
   * @throws {CameraCommandError} If the command fails
   */
  private async send(
    command: 'START' | 'STOP' | 'REFRESH',
    employeeEmail: string,
    reason?: string
  ): Promise<void> {
    try {
      const payload: any = {
        command,
        employeeEmail,
        timestamp: new Date().toISOString(),
      };
      
      if (reason) {
        payload.reason = reason;
      }
      
      await apiClient.post(this.endpoint, payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CameraCommandError(
        `Failed to ${command.toLowerCase()} stream for ${employeeEmail}: ${errorMessage}`,
        error instanceof Error ? error : new Error(errorMessage)
      );
    }
  }
}

