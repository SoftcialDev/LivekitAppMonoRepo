import apiClient from './apiClient';

/**
 * Client for sending camera control commands to the backend.
 */
export class CameraCommandClient {
  private readonly endpoint = '/api/CamaraCommand';

  /**
   * Start the camera stream for the given employee.
   * @param employeeEmail - Employee’s email (used as WebPubSub group name).
   */
  async start(employeeEmail: string): Promise<void> {
    await this.send('START', employeeEmail);
  }

  /**
   * Stop the camera stream for the given employee.
   * @param employeeEmail - Employee’s email.
   */
  async stop(employeeEmail: string): Promise<void> {
    await this.send('STOP', employeeEmail);
  }

  /**
   * Send a camera command to the API.
   * @param command - 'START' or 'STOP'.
   * @param employeeEmail - Employee’s email.
   */
  private async send(
    command: 'START' | 'STOP',
    employeeEmail: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    await apiClient.post(this.endpoint, {
      command,
      employeeEmail,
      timestamp
    });
  }
}
