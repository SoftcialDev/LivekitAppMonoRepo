import { GetLivekitRecordingsResponse } from '../../../src/domain/value-objects/GetLivekitRecordingsResponse';

describe('GetLivekitRecordingsResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const items = [
        {
          id: 'recording-1',
          roomName: 'room1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'active',
          startedAt: '2024-01-01T10:00:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          duration: 3600
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);
      const payload = response.toPayload();

      expect(payload).toEqual({
        items: items,
        count: 1
      });
    });

    it('should handle empty items array', () => {
      const response = new GetLivekitRecordingsResponse([], 0);
      const payload = response.toPayload();

      expect(payload.items).toEqual([]);
      expect(payload.count).toBe(0);
    });
  });
});





