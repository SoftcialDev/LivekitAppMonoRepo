import { CameraStartFailureRequest } from "../schemas/CameraStartFailureSchema";

/**
 * Domain service contract for logging camera start failures.
 */
export interface ICameraFailureService {
  /**
   * Persists a single aggregated failure report for a camera start attempt.
   * @param input - Failure details and the authenticated user identity
   */
  logStartFailure(input: CameraStartFailureRequest & { userAdId: string; userEmail?: string }): Promise<void>;
}


