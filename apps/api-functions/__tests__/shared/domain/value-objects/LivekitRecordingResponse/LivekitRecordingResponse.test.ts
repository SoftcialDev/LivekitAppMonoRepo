import { LivekitRecordingResponse, RecordingResultItem, LivekitRecordingResponsePayload } from '../../../../../shared/domain/value-objects/LivekitRecordingResponse';

describe('LivekitRecordingResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123',
        'egress-456',
        'blob/path/123',
        results,
        'https://sas.example.com/path/123'
      );

      expect(response.message).toBe('Recording started successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBe('egress-456');
      expect(response.blobPath).toBe('blob/path/123');
      expect(response.results).toBe(results);
      expect(response.sasUrl).toBe('https://sas.example.com/path/123');
    });

    it('should create response with minimal properties', () => {
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123'
      );

      expect(response.message).toBe('Recording started successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBeUndefined();
      expect(response.blobPath).toBeUndefined();
      expect(response.results).toBeUndefined();
      expect(response.sasUrl).toBeUndefined();
    });

    it('should create response with different messages', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123');
      const response2 = new LivekitRecordingResponse('Recording stopped', 'room-123');

      expect(response1.message).toBe('Recording started');
      expect(response2.message).toBe('Recording stopped');
    });

    it('should create response with different room names', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-abc');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-xyz');

      expect(response1.roomName).toBe('room-abc');
      expect(response2.roomName).toBe('room-xyz');
    });

    it('should create response with different egress IDs', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-abc');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-xyz');

      expect(response1.egressId).toBe('egress-abc');
      expect(response2.egressId).toBe('egress-xyz');
    });

    it('should create response with different blob paths', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/abc');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/xyz');

      expect(response1.blobPath).toBe('blob/path/abc');
      expect(response2.blobPath).toBe('blob/path/xyz');
    });

    it('should create response with different SAS URLs', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, 'https://sas.example.com/abc');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, 'https://sas.example.com/xyz');

      expect(response1.sasUrl).toBe('https://sas.example.com/abc');
      expect(response2.sasUrl).toBe('https://sas.example.com/xyz');
    });
  });

  describe('forStartCommand factory method', () => {
    it('should create response for start command', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started successfully',
        'room-123',
        'egress-456',
        'blob/path/123'
      );

      expect(response.message).toBe('Recording started successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBe('egress-456');
      expect(response.blobPath).toBe('blob/path/123');
      expect(response.results).toBeUndefined();
      expect(response.sasUrl).toBeUndefined();
    });

    it('should create response for start command with different values', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started',
        'room-abc',
        'egress-xyz',
        'blob/path/abc'
      );

      expect(response.message).toBe('Recording started');
      expect(response.roomName).toBe('room-abc');
      expect(response.egressId).toBe('egress-xyz');
      expect(response.blobPath).toBe('blob/path/abc');
    });

    it('should create multiple instances for start command', () => {
      const response1 = LivekitRecordingResponse.forStartCommand(
        'Recording started',
        'room-1',
        'egress-1',
        'blob/path/1'
      );
      const response2 = LivekitRecordingResponse.forStartCommand(
        'Recording started',
        'room-2',
        'egress-2',
        'blob/path/2'
      );

      expect(response1.roomName).toBe('room-1');
      expect(response2.roomName).toBe('room-2');
      expect(response1.egressId).toBe('egress-1');
      expect(response2.egressId).toBe('egress-2');
    });
  });

  describe('forStopCommand factory method', () => {
    it('should create response for stop command', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = LivekitRecordingResponse.forStopCommand(
        'Recording stopped successfully',
        'room-123',
        results,
        'https://sas.example.com/path/123'
      );

      expect(response.message).toBe('Recording stopped successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBeUndefined();
      expect(response.blobPath).toBeUndefined();
      expect(response.results).toBe(results);
      expect(response.sasUrl).toBe('https://sas.example.com/path/123');
    });

    it('should create response for stop command without SAS URL', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = LivekitRecordingResponse.forStopCommand(
        'Recording stopped successfully',
        'room-123',
        results
      );

      expect(response.message).toBe('Recording stopped successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBeUndefined();
      expect(response.blobPath).toBeUndefined();
      expect(response.results).toBe(results);
      expect(response.sasUrl).toBeUndefined();
    });

    it('should create response for stop command with different values', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-abc',
          egressId: 'egress-xyz',
          status: 'failed',
          blobPath: 'blob/path/abc',
          blobUrl: 'https://blob.example.com/path/abc',
          sasUrl: 'https://sas.example.com/path/abc',
          roomName: 'room-abc',
          initiatorUserId: 'user-abc',
          subjectUserId: 'user-xyz'
        }
      ];
      const response = LivekitRecordingResponse.forStopCommand(
        'Recording stopped',
        'room-abc',
        results,
        'https://sas.example.com/path/abc'
      );

      expect(response.message).toBe('Recording stopped');
      expect(response.roomName).toBe('room-abc');
      expect(response.results).toBe(results);
      expect(response.sasUrl).toBe('https://sas.example.com/path/abc');
    });

    it('should create multiple instances for stop command', () => {
      const results1: RecordingResultItem[] = [
        {
          sessionId: 'session-1',
          egressId: 'egress-1',
          status: 'completed',
          blobPath: 'blob/path/1',
          blobUrl: 'https://blob.example.com/path/1',
          sasUrl: 'https://sas.example.com/path/1',
          roomName: 'room-1',
          initiatorUserId: 'user-1',
          subjectUserId: 'user-1'
        }
      ];
      const results2: RecordingResultItem[] = [
        {
          sessionId: 'session-2',
          egressId: 'egress-2',
          status: 'completed',
          blobPath: 'blob/path/2',
          blobUrl: 'https://blob.example.com/path/2',
          sasUrl: 'https://sas.example.com/path/2',
          roomName: 'room-2',
          initiatorUserId: 'user-2',
          subjectUserId: 'user-2'
        }
      ];

      const response1 = LivekitRecordingResponse.forStopCommand(
        'Recording stopped',
        'room-1',
        results1
      );
      const response2 = LivekitRecordingResponse.forStopCommand(
        'Recording stopped',
        'room-2',
        results2
      );

      expect(response1.roomName).toBe('room-1');
      expect(response2.roomName).toBe('room-2');
      expect(response1.results).toBe(results1);
      expect(response2.results).toBe(results2);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format with all properties', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123',
        'egress-456',
        'blob/path/123',
        results,
        'https://sas.example.com/path/123'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording started successfully',
        roomName: 'room-123',
        egressId: 'egress-456',
        blobPath: 'blob/path/123',
        results: results,
        sasUrl: 'https://sas.example.com/path/123'
      });
    });

    it('should convert to payload format with minimal properties', () => {
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording started successfully',
        roomName: 'room-123'
      });
    });

    it('should convert to payload format with egress ID and blob path', () => {
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123',
        'egress-456',
        'blob/path/123'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording started successfully',
        roomName: 'room-123',
        egressId: 'egress-456',
        blobPath: 'blob/path/123'
      });
    });

    it('should convert to payload format with results and SAS URL', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = new LivekitRecordingResponse(
        'Recording stopped successfully',
        'room-123',
        undefined,
        undefined,
        results,
        'https://sas.example.com/path/123'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording stopped successfully',
        roomName: 'room-123',
        results: results,
        sasUrl: 'https://sas.example.com/path/123'
      });
    });

    it('should convert to payload format with empty results array', () => {
      const results: RecordingResultItem[] = [];
      const response = new LivekitRecordingResponse(
        'Recording stopped successfully',
        'room-123',
        undefined,
        undefined,
        results
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording stopped successfully',
        roomName: 'room-123',
        results: results
      });
    });

    it('should convert to payload format with undefined optional properties', () => {
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123',
        undefined,
        undefined,
        undefined,
        undefined
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Recording started successfully',
        roomName: 'room-123'
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = new LivekitRecordingResponse(
        'Recording started successfully',
        'room-123',
        'egress-456',
        'blob/path/123',
        results,
        'https://sas.example.com/path/123'
      );

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).message = 'modified message';
      }).toThrow();

      expect(() => {
        (response as any).roomName = 'modified room';
      }).toThrow();

      expect(() => {
        (response as any).egressId = 'modified egress';
      }).toThrow();

      expect(() => {
        (response as any).blobPath = 'modified blob';
      }).toThrow();

      expect(() => {
        (response as any).results = [];
      }).toThrow();

      expect(() => {
        (response as any).sasUrl = 'modified sas';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const response = new LivekitRecordingResponse('', 'room-123');

      expect(response.message).toBe('');
    });

    it('should handle empty room name', () => {
      const response = new LivekitRecordingResponse('Recording started', '');

      expect(response.roomName).toBe('');
    });

    it('should handle empty egress ID', () => {
      const response = new LivekitRecordingResponse('Recording started', 'room-123', '');

      expect(response.egressId).toBe('');
    });

    it('should handle empty blob path', () => {
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', '');

      expect(response.blobPath).toBe('');
    });

    it('should handle empty SAS URL', () => {
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, '');

      expect(response.sasUrl).toBe('');
    });

    it('should handle long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new LivekitRecordingResponse(longMessage, 'room-123');

      expect(response.message).toBe(longMessage);
    });

    it('should handle long room name', () => {
      const longRoomName = 'room-' + 'a'.repeat(1000);
      const response = new LivekitRecordingResponse('Recording started', longRoomName);

      expect(response.roomName).toBe(longRoomName);
    });

    it('should handle long egress ID', () => {
      const longEgressId = 'egress-' + 'a'.repeat(1000);
      const response = new LivekitRecordingResponse('Recording started', 'room-123', longEgressId);

      expect(response.egressId).toBe(longEgressId);
    });

    it('should handle long blob path', () => {
      const longBlobPath = 'blob/path/' + 'a'.repeat(1000);
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', longBlobPath);

      expect(response.blobPath).toBe(longBlobPath);
    });

    it('should handle long SAS URL', () => {
      const longSasUrl = 'https://sas.example.com/path/' + 'a'.repeat(1000);
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, longSasUrl);

      expect(response.sasUrl).toBe(longSasUrl);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Recording started!@#$%^&*()';
      const response = new LivekitRecordingResponse(specialMessage, 'room-123');

      expect(response.message).toBe(specialMessage);
    });

    it('should handle special characters in room name', () => {
      const specialRoomName = 'room-123!@#$%^&*()';
      const response = new LivekitRecordingResponse('Recording started', specialRoomName);

      expect(response.roomName).toBe(specialRoomName);
    });

    it('should handle special characters in egress ID', () => {
      const specialEgressId = 'egress-123!@#$%^&*()';
      const response = new LivekitRecordingResponse('Recording started', 'room-123', specialEgressId);

      expect(response.egressId).toBe(specialEgressId);
    });

    it('should handle special characters in blob path', () => {
      const specialBlobPath = 'blob/path/123!@#$%^&*()';
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', specialBlobPath);

      expect(response.blobPath).toBe(specialBlobPath);
    });

    it('should handle special characters in SAS URL', () => {
      const specialSasUrl = 'https://sas.example.com/path/123!@#$%^&*()';
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, specialSasUrl);

      expect(response.sasUrl).toBe(specialSasUrl);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Recording started émojis 🚀';
      const response = new LivekitRecordingResponse(unicodeMessage, 'room-123');

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle unicode characters in room name', () => {
      const unicodeRoomName = 'room-123-émojis-🚀';
      const response = new LivekitRecordingResponse('Recording started', unicodeRoomName);

      expect(response.roomName).toBe(unicodeRoomName);
    });

    it('should handle unicode characters in egress ID', () => {
      const unicodeEgressId = 'egress-123-émojis-🚀';
      const response = new LivekitRecordingResponse('Recording started', 'room-123', unicodeEgressId);

      expect(response.egressId).toBe(unicodeEgressId);
    });

    it('should handle unicode characters in blob path', () => {
      const unicodeBlobPath = 'blob/path/123-émojis-🚀';
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', unicodeBlobPath);

      expect(response.blobPath).toBe(unicodeBlobPath);
    });

    it('should handle unicode characters in SAS URL', () => {
      const unicodeSasUrl = 'https://sas.example.com/path/123-émojis-🚀';
      const response = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, unicodeSasUrl);

      expect(response.sasUrl).toBe(unicodeSasUrl);
    });

    it('should handle many results', () => {
      const results = Array.from({ length: 1000 }, (_, i) => ({
        sessionId: `session-${i}`,
        egressId: `egress-${i}`,
        status: 'completed',
        blobPath: `blob/path/${i}`,
        blobUrl: `https://blob.example.com/path/${i}`,
        sasUrl: `https://sas.example.com/path/${i}`,
        roomName: `room-${i}`,
        initiatorUserId: `user-${i}`,
        subjectUserId: `user-${i}`
      }));
      const response = new LivekitRecordingResponse(
        'Recording stopped successfully',
        'room-123',
        undefined,
        undefined,
        results
      );

      expect(response.results).toHaveLength(1000);
      expect(response.results?.[0].sessionId).toBe('session-0');
      expect(response.results?.[999].sessionId).toBe('session-999');
    });
  });

  describe('type safety', () => {
    it('should accept string for message', () => {
      const response = new LivekitRecordingResponse('Recording started', 'room-123');

      expect(typeof response.message).toBe('string');
    });

    it('should accept string for roomName', () => {
      const response = new LivekitRecordingResponse('Recording started', 'room-123');

      expect(typeof response.roomName).toBe('string');
    });

    it('should accept string or undefined for egressId', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123');

      expect(typeof response1.egressId).toBe('undefined');
      expect(typeof response2.egressId).toBe('string');
    });

    it('should accept string or undefined for blobPath', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123');

      expect(typeof response1.blobPath).toBe('undefined');
      expect(typeof response2.blobPath).toBe('string');
    });

    it('should accept RecordingResultItem array or undefined for results', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', results);

      expect(typeof response1.results).toBe('undefined');
      expect(response2.results).toBeInstanceOf(Array);
      expect(response2.results?.[0]).toHaveProperty('sessionId');
      expect(response2.results?.[0]).toHaveProperty('egressId');
      expect(response2.results?.[0]).toHaveProperty('status');
      expect(response2.results?.[0]).toHaveProperty('roomName');
      expect(response2.results?.[0]).toHaveProperty('initiatorUserId');
    });

    it('should accept string or undefined for sasUrl', () => {
      const response1 = new LivekitRecordingResponse('Recording started', 'room-123');
      const response2 = new LivekitRecordingResponse('Recording started', 'room-123', 'egress-123', 'blob/path/123', undefined, 'https://sas.example.com/path/123');

      expect(typeof response1.sasUrl).toBe('undefined');
      expect(typeof response2.sasUrl).toBe('string');
    });

    it('should return LivekitRecordingResponsePayload from toPayload', () => {
      const response = new LivekitRecordingResponse('Recording started', 'room-123');
      const payload = response.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('message');
      expect(payload).toHaveProperty('roomName');
      expect(typeof payload.message).toBe('string');
      expect(typeof payload.roomName).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle recording start scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started successfully',
        'room-123',
        'egress-456',
        'blob/path/123'
      );

      expect(response.message).toBe('Recording started successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBe('egress-456');
      expect(response.blobPath).toBe('blob/path/123');
      expect(response.results).toBeUndefined();
      expect(response.sasUrl).toBeUndefined();
    });

    it('should handle recording stop scenario', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-123',
          egressId: 'egress-456',
          status: 'completed',
          blobPath: 'blob/path/123',
          blobUrl: 'https://blob.example.com/path/123',
          sasUrl: 'https://sas.example.com/path/123',
          roomName: 'room-123',
          initiatorUserId: 'user-123',
          subjectUserId: 'user-456'
        }
      ];
      const response = LivekitRecordingResponse.forStopCommand(
        'Recording stopped successfully',
        'room-123',
        results,
        'https://sas.example.com/path/123'
      );

      expect(response.message).toBe('Recording stopped successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.egressId).toBeUndefined();
      expect(response.blobPath).toBeUndefined();
      expect(response.results).toBe(results);
      expect(response.sasUrl).toBe('https://sas.example.com/path/123');
    });

    it('should handle supervisor recording scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for supervisor',
        'supervisor-123',
        'egress-supervisor-456',
        'blob/path/supervisor/123'
      );

      expect(response.message).toBe('Recording started for supervisor');
      expect(response.roomName).toBe('supervisor-123');
      expect(response.egressId).toBe('egress-supervisor-456');
      expect(response.blobPath).toBe('blob/path/supervisor/123');
    });

    it('should handle admin recording scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for admin',
        'admin-456',
        'egress-admin-789',
        'blob/path/admin/456'
      );

      expect(response.message).toBe('Recording started for admin');
      expect(response.roomName).toBe('admin-456');
      expect(response.egressId).toBe('egress-admin-789');
      expect(response.blobPath).toBe('blob/path/admin/456');
    });

    it('should handle PSO recording scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for PSO',
        'pso-789',
        'egress-pso-101',
        'blob/path/pso/789'
      );

      expect(response.message).toBe('Recording started for PSO');
      expect(response.roomName).toBe('pso-789');
      expect(response.egressId).toBe('egress-pso-101');
      expect(response.blobPath).toBe('blob/path/pso/789');
    });

    it('should handle contact manager recording scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for contact manager',
        'contact-manager-101',
        'egress-contact-manager-202',
        'blob/path/contact-manager/101'
      );

      expect(response.message).toBe('Recording started for contact manager');
      expect(response.roomName).toBe('contact-manager-101');
      expect(response.egressId).toBe('egress-contact-manager-202');
      expect(response.blobPath).toBe('blob/path/contact-manager/101');
    });

    it('should handle Azure AD Object ID recording scenario', () => {
      const azureObjectId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for Azure AD user',
        azureObjectId,
        'egress-azure-123',
        'blob/path/azure/123'
      );

      expect(response.message).toBe('Recording started for Azure AD user');
      expect(response.roomName).toBe(azureObjectId);
      expect(response.egressId).toBe('egress-azure-123');
      expect(response.blobPath).toBe('blob/path/azure/123');
    });

    it('should handle recording with different email domains scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for user',
        'user@company.com',
        'egress-user-123',
        'blob/path/user/123'
      );

      expect(response.message).toBe('Recording started for user');
      expect(response.roomName).toBe('user@company.com');
      expect(response.egressId).toBe('egress-user-123');
      expect(response.blobPath).toBe('blob/path/user/123');
    });

    it('should handle recording with subdomain email scenario', () => {
      const response = LivekitRecordingResponse.forStartCommand(
        'Recording started for user',
        'user@subdomain.example.com',
        'egress-user-123',
        'blob/path/user/123'
      );

      expect(response.message).toBe('Recording started for user');
      expect(response.roomName).toBe('user@subdomain.example.com');
      expect(response.egressId).toBe('egress-user-123');
      expect(response.blobPath).toBe('blob/path/user/123');
    });

    it('should handle recording with multiple results scenario', () => {
      const results: RecordingResultItem[] = [
        {
          sessionId: 'session-1',
          egressId: 'egress-1',
          status: 'completed',
          blobPath: 'blob/path/1',
          blobUrl: 'https://blob.example.com/path/1',
          sasUrl: 'https://sas.example.com/path/1',
          roomName: 'room-1',
          initiatorUserId: 'user-1',
          subjectUserId: 'user-1'
        },
        {
          sessionId: 'session-2',
          egressId: 'egress-2',
          status: 'completed',
          blobPath: 'blob/path/2',
          blobUrl: 'https://blob.example.com/path/2',
          sasUrl: 'https://sas.example.com/path/2',
          roomName: 'room-2',
          initiatorUserId: 'user-2',
          subjectUserId: 'user-2'
        }
      ];
      const response = LivekitRecordingResponse.forStopCommand(
        'Recording stopped successfully',
        'room-123',
        results,
        'https://sas.example.com/path/123'
      );

      expect(response.message).toBe('Recording stopped successfully');
      expect(response.roomName).toBe('room-123');
      expect(response.results).toHaveLength(2);
      expect(response.results?.[0].sessionId).toBe('session-1');
      expect(response.results?.[1].sessionId).toBe('session-2');
    });
  });
});
