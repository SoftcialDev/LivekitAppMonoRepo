// ui/src/services/livekitClient.ts
import apiClient from './apiClient'

export interface RoomWithToken {
  room:  string
  token: string
}

export interface LiveKitTokenResponse {
  rooms:      RoomWithToken[]
  livekitUrl: string
}

export async function getLiveKitToken(): Promise<LiveKitTokenResponse> {
  const res = await apiClient.get<LiveKitTokenResponse>('/api/LiveKitToken')
  const d   = res.data
  if (
    !d ||
    !Array.isArray(d.rooms) ||
    typeof d.livekitUrl !== 'string' ||
    d.rooms.some(r => typeof r.room !== 'string' || typeof r.token !== 'string')
  ) {
    throw new Error('Invalid LiveKitToken response')
  }
  return d
}
