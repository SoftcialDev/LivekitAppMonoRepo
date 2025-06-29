import apiClient from '../services/apiClient'

/**
 * Details of an active streaming session.
 *
 * @property email     The employee’s email address.
 * @property startedAt ISO 8601 timestamp indicating when the session began.
 */
export interface StreamingSession {
  userId: any
  email: string
  startedAt: string
}

/**
 * Retrieve all currently active streaming sessions.
 *
 * Makes a GET request to `/api/FetchStreamingSessions` and returns an array.
 * If no sessions are returned by the API, this resolves to an empty array.
 *
 * @returns A list of active streaming sessions.
 * @throws HTTPError if the request fails or the response status is not 200.
 */
export async function fetchStreamingSessions(): Promise<StreamingSession[]> {
  const resp = await apiClient.get<{ sessions?: StreamingSession[] }>(
    '/api/FetchStreamingSessions'
  )
  return resp.data.sessions ?? []
}
