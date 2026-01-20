import { LiveKitTokenResponse } from '../../../src/domain/value-objects/LiveKitTokenResponse';

describe('LiveKitTokenResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const rooms = [
        { room: 'room1', token: 'token1' },
        { room: 'room2', token: 'token2' }
      ];
      const response = new LiveKitTokenResponse(rooms, 'https://livekit.example.com');
      const payload = response.toPayload();

      expect(payload).toEqual({
        rooms: rooms,
        livekitUrl: 'https://livekit.example.com'
      });
    });

    it('should handle empty rooms array', () => {
      const response = new LiveKitTokenResponse([], 'https://livekit.example.com');
      const payload = response.toPayload();

      expect(payload.rooms).toEqual([]);
      expect(payload.livekitUrl).toBe('https://livekit.example.com');
    });
  });
});






