import { GetLivekitRecordingsRequest } from '../../../../../shared/domain/value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsRequestPayload } from '../../../../../shared/domain/schemas/GetLivekitRecordingsSchema';

describe('GetLivekitRecordingsRequest', () => {
  describe('constructor', () => {
    it('should create request with default values', () => {
      const request = new GetLivekitRecordingsRequest();

      expect(request.roomName).toBeUndefined();
      expect(request.limit).toBe(1000);
      expect(request.order).toBe('desc');
      expect(request.includeSas).toBe(true);
      expect(request.sasMinutes).toBe(60);
    });

    it('should create request with all parameters', () => {
      const request = new GetLivekitRecordingsRequest(
        'room-123',
        50,
        'asc',
        false,
        30
      );

      expect(request.roomName).toBe('room-123');
      expect(request.limit).toBe(50);
      expect(request.order).toBe('asc');
      expect(request.includeSas).toBe(false);
      expect(request.sasMinutes).toBe(30);
    });

    it('should create request with partial parameters', () => {
      const request = new GetLivekitRecordingsRequest('room-456');

      expect(request.roomName).toBe('room-456');
      expect(request.limit).toBe(1000);
      expect(request.order).toBe('desc');
      expect(request.includeSas).toBe(true);
      expect(request.sasMinutes).toBe(60);
    });

    it('should create request with different limit values', () => {
      const request1 = new GetLivekitRecordingsRequest(undefined, 10);
      const request2 = new GetLivekitRecordingsRequest(undefined, 200);

      expect(request1.limit).toBe(10);
      expect(request2.limit).toBe(200);
    });

    it('should create request with different order values', () => {
      const request1 = new GetLivekitRecordingsRequest(undefined, 1000, 'asc');
      const request2 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc');

      expect(request1.order).toBe('asc');
      expect(request2.order).toBe('desc');
    });

    it('should create request with different includeSas values', () => {
      const request1 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true);
      const request2 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', false);

      expect(request1.includeSas).toBe(true);
      expect(request2.includeSas).toBe(false);
    });

    it('should create request with different sasMinutes values', () => {
      const request1 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true, 30);
      const request2 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true, 120);

      expect(request1.sasMinutes).toBe(30);
      expect(request2.sasMinutes).toBe(120);
    });
  });

  describe('fromQuery', () => {
    it('should create request from valid payload', () => {
      const payload: GetLivekitRecordingsRequestPayload = {
        roomName: 'room-123',
        limit: 50,
        order: 'asc',
        includeSas: false,
        sasMinutes: 30
      };
      const request = GetLivekitRecordingsRequest.fromQuery(payload);

      expect(request.roomName).toBe('room-123');
      expect(request.limit).toBe(50);
      expect(request.order).toBe('asc');
      expect(request.includeSas).toBe(false);
      expect(request.sasMinutes).toBe(30);
    });

    it('should create request from payload with undefined roomName', () => {
      const payload: GetLivekitRecordingsRequestPayload = {
        limit: 100,
        order: 'desc',
        includeSas: true,
        sasMinutes: 60
      };
      const request = GetLivekitRecordingsRequest.fromQuery(payload);

      expect(request.roomName).toBeUndefined();
      expect(request.limit).toBe(100);
      expect(request.order).toBe('desc');
      expect(request.includeSas).toBe(true);
      expect(request.sasMinutes).toBe(60);
    });

    it('should create request from payload with different values', () => {
      const payload1: GetLivekitRecordingsRequestPayload = {
        roomName: 'room-1',
        limit: 10,
        order: 'asc',
        includeSas: false,
        sasMinutes: 15
      };
      const payload2: GetLivekitRecordingsRequestPayload = {
        roomName: 'room-2',
        limit: 200,
        order: 'desc',
        includeSas: true,
        sasMinutes: 90
      };

      const request1 = GetLivekitRecordingsRequest.fromQuery(payload1);
      const request2 = GetLivekitRecordingsRequest.fromQuery(payload2);

      expect(request1.roomName).toBe('room-1');
      expect(request1.limit).toBe(10);
      expect(request1.order).toBe('asc');
      expect(request1.includeSas).toBe(false);
      expect(request1.sasMinutes).toBe(15);

      expect(request2.roomName).toBe('room-2');
      expect(request2.limit).toBe(200);
      expect(request2.order).toBe('desc');
      expect(request2.includeSas).toBe(true);
      expect(request2.sasMinutes).toBe(90);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new GetLivekitRecordingsRequest('room-123', 50, 'asc', false, 30);

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).roomName = 'modified-room';
      }).toThrow();

      expect(() => {
        (request as any).limit = 999;
      }).toThrow();

      expect(() => {
        (request as any).order = 'modified';
      }).toThrow();

      expect(() => {
        (request as any).includeSas = true;
      }).toThrow();

      expect(() => {
        (request as any).sasMinutes = 999;
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty room name', () => {
      const request = new GetLivekitRecordingsRequest('');

      expect(request.roomName).toBe('');
    });

    it('should handle long room name', () => {
      const longRoomName = 'room-' + 'a'.repeat(1000);
      const request = new GetLivekitRecordingsRequest(longRoomName);

      expect(request.roomName).toBe(longRoomName);
    });

    it('should handle special characters in room name', () => {
      const specialRoomName = 'room-123!@#$%^&*()';
      const request = new GetLivekitRecordingsRequest(specialRoomName);

      expect(request.roomName).toBe(specialRoomName);
    });

    it('should handle unicode characters in room name', () => {
      const unicodeRoomName = 'room-123-émojis-🚀';
      const request = new GetLivekitRecordingsRequest(unicodeRoomName);

      expect(request.roomName).toBe(unicodeRoomName);
    });

    it('should handle minimum limit value', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 1);

      expect(request.limit).toBe(1);
    });

    it('should handle maximum limit value', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 200);

      expect(request.limit).toBe(200);
    });

    it('should handle minimum sasMinutes value', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true, 1);

      expect(request.sasMinutes).toBe(1);
    });

    it('should handle large sasMinutes value', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true, 1440);

      expect(request.sasMinutes).toBe(1440);
    });

    it('should handle zero sasMinutes value', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true, 0);

      expect(request.sasMinutes).toBe(0);
    });
  });

  describe('type safety', () => {
    it('should accept string or undefined for roomName', () => {
      const request1 = new GetLivekitRecordingsRequest('room-123');
      const request2 = new GetLivekitRecordingsRequest(undefined);

      expect(typeof request1.roomName).toBe('string');
      expect(request2.roomName).toBeUndefined();
    });

    it('should accept number for limit', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 50);
      expect(typeof request.limit).toBe('number');
    });

    it('should accept asc or desc for order', () => {
      const request1 = new GetLivekitRecordingsRequest(undefined, 1000, 'asc');
      const request2 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc');

      expect(request1.order).toBe('asc');
      expect(request2.order).toBe('desc');
    });

    it('should accept boolean for includeSas', () => {
      const request1 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true);
      const request2 = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', false);

      expect(typeof request1.includeSas).toBe('boolean');
      expect(typeof request2.includeSas).toBe('boolean');
    });

    it('should accept number for sasMinutes', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 1000, 'desc', true, 30);
      expect(typeof request.sasMinutes).toBe('number');
    });

    it('should accept GetLivekitRecordingsRequestPayload interface', () => {
      const payload: GetLivekitRecordingsRequestPayload = {
        roomName: 'room-123',
        limit: 50,
        order: 'asc',
        includeSas: false,
        sasMinutes: 30
      };
      const request = GetLivekitRecordingsRequest.fromQuery(payload);

      expect(request).toBeInstanceOf(GetLivekitRecordingsRequest);
      expect(request.roomName).toBe('room-123');
      expect(request.limit).toBe(50);
      expect(request.order).toBe('asc');
      expect(request.includeSas).toBe(false);
      expect(request.sasMinutes).toBe(30);
    });
  });

  describe('validation scenarios', () => {
    it('should handle room-specific recordings scenario', () => {
      const request = new GetLivekitRecordingsRequest('meeting-room-1', 25, 'desc', true, 60);

      expect(request.roomName).toBe('meeting-room-1');
      expect(request.limit).toBe(25);
      expect(request.order).toBe('desc');
      expect(request.includeSas).toBe(true);
      expect(request.sasMinutes).toBe(60);
    });

    it('should handle all recordings scenario', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 100, 'asc', false, 30);

      expect(request.roomName).toBeUndefined();
      expect(request.limit).toBe(100);
      expect(request.order).toBe('asc');
      expect(request.includeSas).toBe(false);
      expect(request.sasMinutes).toBe(30);
    });

    it('should handle secure recordings scenario', () => {
      const request = new GetLivekitRecordingsRequest('secure-room', 10, 'desc', true, 120);

      expect(request.roomName).toBe('secure-room');
      expect(request.limit).toBe(10);
      expect(request.order).toBe('desc');
      expect(request.includeSas).toBe(true);
      expect(request.sasMinutes).toBe(120);
    });

    it('should handle public recordings scenario', () => {
      const request = new GetLivekitRecordingsRequest('public-room', 50, 'asc', false, 0);

      expect(request.roomName).toBe('public-room');
      expect(request.limit).toBe(50);
      expect(request.order).toBe('asc');
      expect(request.includeSas).toBe(false);
      expect(request.sasMinutes).toBe(0);
    });

    it('should handle recent recordings scenario', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 20, 'desc', true, 60);

      expect(request.roomName).toBeUndefined();
      expect(request.limit).toBe(20);
      expect(request.order).toBe('desc');
      expect(request.includeSas).toBe(true);
      expect(request.sasMinutes).toBe(60);
    });

    it('should handle historical recordings scenario', () => {
      const request = new GetLivekitRecordingsRequest(undefined, 200, 'asc', false, 30);

      expect(request.roomName).toBeUndefined();
      expect(request.limit).toBe(200);
      expect(request.order).toBe('asc');
      expect(request.includeSas).toBe(false);
      expect(request.sasMinutes).toBe(30);
    });
  });
});
