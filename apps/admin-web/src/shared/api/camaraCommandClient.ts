import apiClient from "./apiClient";

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
   * @param employeeEmail – Employee's email.
   * @param reason – Optional reason for stopping the stream.
   */
  public async stop(employeeEmail: string, reason?: string): Promise<void> {
    await this.send('STOP', employeeEmail, reason);
  }

  /**
   * Send a camera command with timestamp.
   */
  private async send(
    command: 'START' | 'STOP',
    employeeEmail: string,
    reason?: string
  ): Promise<void> {
    const payload: any = {
      command,
      employeeEmail,
      timestamp: new Date().toISOString(),
    };
    
    if (reason) {
      payload.reason = reason;
    }
    
    console.log('[CameraCommandClient] Sending payload:', payload);
    await apiClient.post(this.endpoint, payload);
  }
}
