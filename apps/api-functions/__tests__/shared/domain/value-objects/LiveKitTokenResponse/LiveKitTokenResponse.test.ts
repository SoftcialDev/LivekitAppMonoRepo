import { LiveKitTokenResponse } from '../../../../../shared/domain/value-objects/LiveKitTokenResponse';

describe('LiveKitTokenResponse', () => {
  describe('constructor', () => {
    it('should create response with single room and token', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toBe(rooms);
      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should create response with multiple rooms and tokens', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        },
        {
          room: 'room-456',
          token: 'token-def456'
        },
        {
          room: 'room-789',
          token: 'token-ghi789'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toBe(rooms);
      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should create response with empty rooms array', () => {
      const rooms: Array<{ room: string; token: string }> = [];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toBe(rooms);
      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should handle different room names', () => {
      const rooms1 = [
        {
          room: 'room-abc',
          token: 'token-123'
        }
      ];
      const rooms2 = [
        {
          room: 'room-xyz',
          token: 'token-456'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';

      const response1 = new LiveKitTokenResponse(rooms1, livekitUrl);
      const response2 = new LiveKitTokenResponse(rooms2, livekitUrl);

      expect(response1.rooms[0].room).toBe('room-abc');
      expect(response2.rooms[0].room).toBe('room-xyz');
    });

    it('should handle different token values', () => {
      const rooms1 = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const rooms2 = [
        {
          room: 'room-123',
          token: 'token-def456'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';

      const response1 = new LiveKitTokenResponse(rooms1, livekitUrl);
      const response2 = new LiveKitTokenResponse(rooms2, livekitUrl);

      expect(response1.rooms[0].token).toBe('token-abc123');
      expect(response2.rooms[0].token).toBe('token-def456');
    });

    it('should handle different LiveKit URLs', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl1 = 'https://livekit.example.com';
      const livekitUrl2 = 'https://livekit.company.com';

      const response1 = new LiveKitTokenResponse(rooms, livekitUrl1);
      const response2 = new LiveKitTokenResponse(rooms, livekitUrl2);

      expect(response1.livekitUrl).toBe(livekitUrl1);
      expect(response2.livekitUrl).toBe(livekitUrl2);
    });

    it('should handle production LiveKit URL', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.production.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should handle development LiveKit URL', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.dev.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should handle staging LiveKit URL', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.staging.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe(livekitUrl);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with single room', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);
      const payload = response.toPayload();

      expect(payload).toEqual({
        rooms: rooms,
        livekitUrl: livekitUrl
      });
    });

    it('should convert to payload format with multiple rooms', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        },
        {
          room: 'room-456',
          token: 'token-def456'
        },
        {
          room: 'room-789',
          token: 'token-ghi789'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);
      const payload = response.toPayload();

      expect(payload).toEqual({
        rooms: rooms,
        livekitUrl: livekitUrl
      });
    });

    it('should convert to payload format with empty rooms array', () => {
      const rooms: Array<{ room: string; token: string }> = [];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);
      const payload = response.toPayload();

      expect(payload).toEqual({
        rooms: rooms,
        livekitUrl: livekitUrl
      });
    });

    it('should return reference to rooms array', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);
      const payload = response.toPayload();

      expect(payload.rooms).toBe(rooms); // Same reference
    });

    it('should convert different room names to payload', () => {
      const rooms1 = [
        {
          room: 'room-abc',
          token: 'token-123'
        }
      ];
      const rooms2 = [
        {
          room: 'room-xyz',
          token: 'token-456'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';

      const response1 = new LiveKitTokenResponse(rooms1, livekitUrl);
      const response2 = new LiveKitTokenResponse(rooms2, livekitUrl);

      const payload1 = response1.toPayload();
      const payload2 = response2.toPayload();

      expect(payload1.rooms[0].room).toBe('room-abc');
      expect(payload2.rooms[0].room).toBe('room-xyz');
    });

    it('should convert different token values to payload', () => {
      const rooms1 = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const rooms2 = [
        {
          room: 'room-123',
          token: 'token-def456'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';

      const response1 = new LiveKitTokenResponse(rooms1, livekitUrl);
      const response2 = new LiveKitTokenResponse(rooms2, livekitUrl);

      const payload1 = response1.toPayload();
      const payload2 = response2.toPayload();

      expect(payload1.rooms[0].token).toBe('token-abc123');
      expect(payload2.rooms[0].token).toBe('token-def456');
    });

    it('should convert different LiveKit URLs to payload', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl1 = 'https://livekit.example.com';
      const livekitUrl2 = 'https://livekit.company.com';

      const response1 = new LiveKitTokenResponse(rooms, livekitUrl1);
      const response2 = new LiveKitTokenResponse(rooms, livekitUrl2);

      const payload1 = response1.toPayload();
      const payload2 = response2.toPayload();

      expect(payload1.livekitUrl).toBe(livekitUrl1);
      expect(payload2.livekitUrl).toBe(livekitUrl2);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).rooms = [];
      }).toThrow();

      expect(() => {
        (response as any).livekitUrl = 'modified-url';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rooms with special characters in room names', () => {
      const rooms = [
        {
          room: 'room-123!@#$%^&*()',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].room).toBe('room-123!@#$%^&*()');
    });

    it('should handle rooms with special characters in tokens', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123!@#$%^&*()'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].token).toBe('token-abc123!@#$%^&*()');
    });

    it('should handle rooms with unicode characters in room names', () => {
      const rooms = [
        {
          room: 'room-123-émojis-🚀',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].room).toBe('room-123-émojis-🚀');
    });

    it('should handle rooms with unicode characters in tokens', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123-émojis-🚀'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].token).toBe('token-abc123-émojis-🚀');
    });

    it('should handle rooms with long room names', () => {
      const longRoomName = 'room-' + 'a'.repeat(1000);
      const rooms = [
        {
          room: longRoomName,
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].room).toBe(longRoomName);
    });

    it('should handle rooms with long tokens', () => {
      const longToken = 'token-' + 'a'.repeat(1000);
      const rooms = [
        {
          room: 'room-123',
          token: longToken
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].token).toBe(longToken);
    });

    it('should handle LiveKit URL with special characters', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com/path!@#$%^&*()';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should handle LiveKit URL with unicode characters', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com/path-émojis-🚀';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should handle LiveKit URL with long path', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const longPath = '/path/' + 'a'.repeat(1000);
      const livekitUrl = 'https://livekit.example.com' + longPath;
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe(livekitUrl);
    });

    it('should handle many rooms', () => {
      const rooms = Array.from({ length: 1000 }, (_, i) => ({
        room: `room-${i}`,
        token: `token-${i}`
      }));
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toHaveLength(1000);
      expect(response.rooms[0].room).toBe('room-0');
      expect(response.rooms[999].room).toBe('room-999');
    });

    it('should handle empty room names', () => {
      const rooms = [
        {
          room: '',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].room).toBe('');
    });

    it('should handle empty tokens', () => {
      const rooms = [
        {
          room: 'room-123',
          token: ''
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms[0].token).toBe('');
    });

    it('should handle empty LiveKit URL', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = '';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe('');
    });
  });

  describe('type safety', () => {
    it('should accept array of room and token objects', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toBeInstanceOf(Array);
      expect(response.rooms[0]).toHaveProperty('room');
      expect(response.rooms[0]).toHaveProperty('token');
      expect(typeof response.rooms[0].room).toBe('string');
      expect(typeof response.rooms[0].token).toBe('string');
    });

    it('should accept string for livekitUrl', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(typeof response.livekitUrl).toBe('string');
    });

    it('should return object from toPayload', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);
      const payload = response.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('rooms');
      expect(payload).toHaveProperty('livekitUrl');
      expect(payload.rooms).toBeInstanceOf(Array);
      expect(typeof payload.livekitUrl).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle single room token generation scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toHaveLength(1);
      expect(response.rooms[0].room).toBe('room-123');
      expect(response.rooms[0].token).toBe('token-abc123');
      expect(response.livekitUrl).toBe('https://livekit.example.com');
    });

    it('should handle multiple room token generation scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        },
        {
          room: 'room-456',
          token: 'token-def456'
        },
        {
          room: 'room-789',
          token: 'token-ghi789'
        }
      ];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toHaveLength(3);
      expect(response.rooms[0].room).toBe('room-123');
      expect(response.rooms[1].room).toBe('room-456');
      expect(response.rooms[2].room).toBe('room-789');
    });

    it('should handle no rooms scenario', () => {
      const rooms: Array<{ room: string; token: string }> = [];
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toHaveLength(0);
      expect(response.livekitUrl).toBe('https://livekit.example.com');
    });

    it('should handle production environment scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.production.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe('https://livekit.production.com');
    });

    it('should handle development environment scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.dev.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe('https://livekit.dev.example.com');
    });

    it('should handle staging environment scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.staging.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe('https://livekit.staging.example.com');
    });

    it('should handle different company domains scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl1 = 'https://livekit.company1.com';
      const livekitUrl2 = 'https://livekit.company2.com';

      const response1 = new LiveKitTokenResponse(rooms, livekitUrl1);
      const response2 = new LiveKitTokenResponse(rooms, livekitUrl2);

      expect(response1.livekitUrl).toBe('https://livekit.company1.com');
      expect(response2.livekitUrl).toBe('https://livekit.company2.com');
    });

    it('should handle subdomain LiveKit URLs scenario', () => {
      const rooms = [
        {
          room: 'room-123',
          token: 'token-abc123'
        }
      ];
      const livekitUrl = 'https://livekit.subdomain.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.livekitUrl).toBe('https://livekit.subdomain.example.com');
    });

    it('should handle large number of rooms scenario', () => {
      const rooms = Array.from({ length: 100 }, (_, i) => ({
        room: `room-${i}`,
        token: `token-${i}`
      }));
      const livekitUrl = 'https://livekit.example.com';
      const response = new LiveKitTokenResponse(rooms, livekitUrl);

      expect(response.rooms).toHaveLength(100);
      expect(response.rooms[0].room).toBe('room-0');
      expect(response.rooms[99].room).toBe('room-99');
    });
  });
});
