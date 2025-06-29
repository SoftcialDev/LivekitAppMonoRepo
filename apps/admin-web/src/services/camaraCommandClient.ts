import apiClient from './apiClient';

/**
 * Client for sending camera control commands to the backend.
 */
export class CameraCommandClient {
  private readonly endpoint = '/api/CamaraCommand';

  /**
   * Instruct the backend to start streaming for this employee.
   * @param employeeEmail – Employee’s email (used as group name).
   */
  public async start(employeeEmail: string): Promise<void> {
    await this.send('START', employeeEmail);
  }

  /**
   * Instruct the backend to stop streaming for this employee.
   * @param employeeEmail – Employee’s email.
   */
  public async stop(employeeEmail: string): Promise<void> {
    await this.send('STOP', employeeEmail);
  }

  /**
   * Send a camera command with timestamp.
   */
  private async send(
    command: 'START' | 'STOP',
    employeeEmail: string
  ): Promise<void> {
    await apiClient.post(this.endpoint, {
      command,
      employeeEmail,
      timestamp: new Date().toISOString(),
    });
  }
}
