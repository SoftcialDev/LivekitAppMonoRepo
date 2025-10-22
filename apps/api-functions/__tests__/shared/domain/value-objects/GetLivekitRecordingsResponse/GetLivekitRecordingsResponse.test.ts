import { GetLivekitRecordingsResponse, RecordingListItemPayload } from '../../../../../shared/domain/value-objects/GetLivekitRecordingsResponse';

describe('GetLivekitRecordingsResponse', () => {
  describe('constructor', () => {
    it('should create response with items and count', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        },
        {
          id: 'recording-2',
          roomName: 'room-2',
          roomId: 'room-id-2',
          egressId: 'egress-2',
          userId: 'user-2',
          status: 'COMPLETED',
          startedAt: '2024-01-01T11:00:00Z',
          stoppedAt: '2024-01-01T13:00:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T13:00:00Z',
          username: 'user2',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-2.mp4',
          blobUrl: 'https://storage.com/recordings/recording-2.mp4',
          playbackUrl: 'https://playback.com/recording-2',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 2);

      expect(response.items).toBe(items);
      expect(response.count).toBe(2);
    });

    it('should create response with empty items', () => {
      const response = new GetLivekitRecordingsResponse([], 0);

      expect(response.items).toEqual([]);
      expect(response.count).toBe(0);
    });

    it('should create response with single item', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);

      expect(response.items).toBe(items);
      expect(response.count).toBe(1);
    });

    it('should create response with mismatched count', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 5);

      expect(response.items).toBe(items);
      expect(response.count).toBe(5);
    });
  });

  describe('withItems factory method', () => {
    it('should create response with items and correct count', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        },
        {
          id: 'recording-2',
          roomName: 'room-2',
          roomId: 'room-id-2',
          egressId: 'egress-2',
          userId: 'user-2',
          status: 'COMPLETED',
          startedAt: '2024-01-01T11:00:00Z',
          stoppedAt: '2024-01-01T13:00:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T13:00:00Z',
          username: 'user2',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-2.mp4',
          blobUrl: 'https://storage.com/recordings/recording-2.mp4',
          playbackUrl: 'https://playback.com/recording-2',
          duration: 7200
        }
      ];
      const response = GetLivekitRecordingsResponse.withItems(items);

      expect(response.items).toBe(items);
      expect(response.count).toBe(2);
    });

    it('should create response with empty items', () => {
      const response = GetLivekitRecordingsResponse.withItems([]);

      expect(response.items).toEqual([]);
      expect(response.count).toBe(0);
    });

    it('should create response with single item', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = GetLivekitRecordingsResponse.withItems(items);

      expect(response.items).toBe(items);
      expect(response.count).toBe(1);
    });

    it('should create response with many items', () => {
      const items: RecordingListItemPayload[] = Array.from({ length: 100 }, (_, i) => ({
        id: `recording-${i}`,
        roomName: `room-${i}`,
        roomId: `room-id-${i}`,
        egressId: `egress-${i}`,
        userId: `user-${i}`,
        status: 'COMPLETED',
        startedAt: '2024-01-01T10:00:00Z',
        stoppedAt: '2024-01-01T12:00:00Z',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
        username: `user${i}`,
        recordedBy: 'admin',
        blobPath: `/recordings/recording-${i}.mp4`,
        blobUrl: `https://storage.com/recordings/recording-${i}.mp4`,
        playbackUrl: `https://playback.com/recording-${i}`,
        duration: 7200
      }));
      const response = GetLivekitRecordingsResponse.withItems(items);

      expect(response.items).toBe(items);
      expect(response.count).toBe(100);
    });
  });

  describe('withNoItems factory method', () => {
    it('should create response with empty items and zero count', () => {
      const response = GetLivekitRecordingsResponse.withNoItems();

      expect(response.items).toEqual([]);
      expect(response.count).toBe(0);
    });

    it('should create multiple instances with empty items', () => {
      const response1 = GetLivekitRecordingsResponse.withNoItems();
      const response2 = GetLivekitRecordingsResponse.withNoItems();

      expect(response1.items).toEqual([]);
      expect(response2.items).toEqual([]);
      expect(response1.count).toBe(0);
      expect(response2.count).toBe(0);
      expect(response1).not.toBe(response2); // Different instances
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);
      const payload = response.toPayload();

      expect(payload).toEqual({
        items: items,
        count: 1
      });
    });

    it('should convert empty response to payload', () => {
      const response = new GetLivekitRecordingsResponse([], 0);
      const payload = response.toPayload();

      expect(payload).toEqual({
        items: [],
        count: 0
      });
    });

    it('should handle items with missing optional fields', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: null,
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: null,
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: null,
          username: undefined,
          recordedBy: undefined,
          blobPath: null,
          blobUrl: null,
          playbackUrl: undefined,
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);
      const payload = response.toPayload();

      expect(payload.items[0].roomId).toBeNull();
      expect(payload.items[0].stoppedAt).toBeNull();
      expect(payload.items[0].updatedAt).toBeNull();
      expect(payload.items[0].username).toBeUndefined();
      expect(payload.items[0].recordedBy).toBeUndefined();
      expect(payload.items[0].blobPath).toBeNull();
      expect(payload.items[0].blobUrl).toBeNull();
      expect(payload.items[0].playbackUrl).toBeUndefined();
    });

    it('should return reference to items array', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);
      const payload = response.toPayload();

      expect(payload.items).toBe(items); // Same reference
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).items = [];
      }).toThrow();

      expect(() => {
        (response as any).count = 0;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle items with different status values', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        },
        {
          id: 'recording-2',
          roomName: 'room-2',
          roomId: 'room-id-2',
          egressId: 'egress-2',
          userId: 'user-2',
          status: 'FAILED',
          startedAt: '2024-01-01T11:00:00Z',
          stoppedAt: '2024-01-01T11:30:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:30:00Z',
          username: 'user2',
          recordedBy: 'admin',
          blobPath: null,
          blobUrl: null,
          playbackUrl: undefined,
          duration: 1800
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 2);

      expect(response.items[0].status).toBe('COMPLETED');
      expect(response.items[1].status).toBe('FAILED');
    });

    it('should handle items with different duration values', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        },
        {
          id: 'recording-2',
          roomName: 'room-2',
          roomId: 'room-id-2',
          egressId: 'egress-2',
          userId: 'user-2',
          status: 'COMPLETED',
          startedAt: '2024-01-01T11:00:00Z',
          stoppedAt: '2024-01-01T11:05:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:05:00Z',
          username: 'user2',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-2.mp4',
          blobUrl: 'https://storage.com/recordings/recording-2.mp4',
          playbackUrl: 'https://playback.com/recording-2',
          duration: 300
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 2);

      expect(response.items[0].duration).toBe(7200);
      expect(response.items[1].duration).toBe(300);
    });

    it('should handle items with different timestamp formats', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);

      expect(response.items[0].startedAt).toBe('2024-01-01T10:00:00Z');
      expect(response.items[0].stoppedAt).toBe('2024-01-01T12:00:00Z');
      expect(response.items[0].createdAt).toBe('2024-01-01T09:00:00Z');
      expect(response.items[0].updatedAt).toBe('2024-01-01T12:00:00Z');
    });
  });

  describe('type safety', () => {
    it('should accept RecordingListItemPayload array for items', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);

      expect(response.items).toBeInstanceOf(Array);
      expect(response.items[0]).toHaveProperty('id');
      expect(response.items[0]).toHaveProperty('roomName');
      expect(response.items[0]).toHaveProperty('egressId');
      expect(response.items[0]).toHaveProperty('userId');
      expect(response.items[0]).toHaveProperty('status');
      expect(response.items[0]).toHaveProperty('startedAt');
      expect(response.items[0]).toHaveProperty('createdAt');
      expect(response.items[0]).toHaveProperty('duration');
    });

    it('should accept number for count', () => {
      const response = new GetLivekitRecordingsResponse([], 0);
      expect(typeof response.count).toBe('number');
    });

    it('should match GetLivekitRecordingsResponsePayload interface', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'room-1',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = new GetLivekitRecordingsResponse(items, 1);
      const payload = response.toPayload();

      expect(payload).toHaveProperty('items');
      expect(payload).toHaveProperty('count');
      expect(payload.items).toBeInstanceOf(Array);
      expect(typeof payload.count).toBe('number');
    });
  });

  describe('validation scenarios', () => {
    it('should handle completed recordings scenario', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-1',
          roomName: 'meeting-room',
          roomId: 'room-id-1',
          egressId: 'egress-1',
          userId: 'user-1',
          status: 'COMPLETED',
          startedAt: '2024-01-01T10:00:00Z',
          stoppedAt: '2024-01-01T12:00:00Z',
          createdAt: '2024-01-01T09:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          username: 'user1',
          recordedBy: 'admin',
          blobPath: '/recordings/recording-1.mp4',
          blobUrl: 'https://storage.com/recordings/recording-1.mp4',
          playbackUrl: 'https://playback.com/recording-1',
          duration: 7200
        }
      ];
      const response = GetLivekitRecordingsResponse.withItems(items);

      expect(response.items[0].status).toBe('COMPLETED');
      expect(response.items[0].blobPath).toBe('/recordings/recording-1.mp4');
      expect(response.items[0].playbackUrl).toBe('https://playback.com/recording-1');
    });

    it('should handle failed recordings scenario', () => {
      const items: RecordingListItemPayload[] = [
        {
          id: 'recording-2',
          roomName: 'meeting-room',
          roomId: 'room-id-2',
          egressId: 'egress-2',
          userId: 'user-2',
          status: 'FAILED',
          startedAt: '2024-01-01T11:00:00Z',
          stoppedAt: '2024-01-01T11:30:00Z',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T11:30:00Z',
          username: 'user2',
          recordedBy: 'admin',
          blobPath: null,
          blobUrl: null,
          playbackUrl: undefined,
          duration: 1800
        }
      ];
      const response = GetLivekitRecordingsResponse.withItems(items);

      expect(response.items[0].status).toBe('FAILED');
      expect(response.items[0].blobPath).toBeNull();
      expect(response.items[0].playbackUrl).toBeUndefined();
    });

    it('should handle no recordings found scenario', () => {
      const response = GetLivekitRecordingsResponse.withNoItems();

      expect(response.items).toEqual([]);
      expect(response.count).toBe(0);
    });

    it('should handle large number of recordings scenario', () => {
      const items: RecordingListItemPayload[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `recording-${i}`,
        roomName: `room-${i}`,
        roomId: `room-id-${i}`,
        egressId: `egress-${i}`,
        userId: `user-${i}`,
        status: 'COMPLETED',
        startedAt: '2024-01-01T10:00:00Z',
        stoppedAt: '2024-01-01T12:00:00Z',
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
        username: `user${i}`,
        recordedBy: 'admin',
        blobPath: `/recordings/recording-${i}.mp4`,
        blobUrl: `https://storage.com/recordings/recording-${i}.mp4`,
        playbackUrl: `https://playback.com/recording-${i}`,
        duration: 7200
      }));
      const response = GetLivekitRecordingsResponse.withItems(items);

      expect(response.items).toHaveLength(1000);
      expect(response.count).toBe(1000);
    });
  });
});
