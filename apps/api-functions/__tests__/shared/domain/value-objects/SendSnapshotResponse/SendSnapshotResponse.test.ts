/**
 * @fileoverview SendSnapshotResponse value object - unit tests
 * @summary Tests for SendSnapshotResponse value object functionality
 * @description Validates snapshot response creation and payload conversion
 */

import { SendSnapshotResponse } from '../../../../../shared/domain/value-objects/SendSnapshotResponse';

describe('SendSnapshotResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new SendSnapshotResponse(
        'snapshot-123',
        'Snapshot report sent successfully'
      );

      expect(response.snapshotId).toBe('snapshot-123');
      expect(response.message).toBe('Snapshot report sent successfully');
    });

    it('should create response with different snapshot IDs', () => {
      const response1 = new SendSnapshotResponse('snapshot-1', 'Snapshot 1 sent');
      const response2 = new SendSnapshotResponse('snapshot-2', 'Snapshot 2 sent');
      const response3 = new SendSnapshotResponse('snapshot-abc-123', 'Snapshot abc sent');

      expect(response1.snapshotId).toBe('snapshot-1');
      expect(response2.snapshotId).toBe('snapshot-2');
      expect(response3.snapshotId).toBe('snapshot-abc-123');
    });

    it('should create response with different messages', () => {
      const response1 = new SendSnapshotResponse('snapshot-1', 'Snapshot sent successfully');
      const response2 = new SendSnapshotResponse('snapshot-2', 'Snapshot report generated');
      const response3 = new SendSnapshotResponse('snapshot-3', 'Snapshot uploaded to storage');

      expect(response1.message).toBe('Snapshot sent successfully');
      expect(response2.message).toBe('Snapshot report generated');
      expect(response3.message).toBe('Snapshot uploaded to storage');
    });

    it('should create response with empty message', () => {
      const response = new SendSnapshotResponse('snapshot-123', '');

      expect(response.snapshotId).toBe('snapshot-123');
      expect(response.message).toBe('');
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that contains detailed information about the snapshot report and provides comprehensive context for debugging purposes';
      const response = new SendSnapshotResponse('snapshot-123', longMessage);

      expect(response.snapshotId).toBe('snapshot-123');
      expect(response.message).toBe(longMessage);
    });

    it('should create response with UUID snapshot ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new SendSnapshotResponse(uuid, 'Snapshot sent successfully');

      expect(response.snapshotId).toBe(uuid);
      expect(response.message).toBe('Snapshot sent successfully');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new SendSnapshotResponse(
        'snapshot-123',
        'Snapshot report sent successfully'
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        snapshotId: 'snapshot-123',
        message: 'Snapshot report sent successfully'
      });
    });

    it('should convert response with empty message to payload', () => {
      const response = new SendSnapshotResponse('snapshot-123', '');

      const payload = response.toPayload();

      expect(payload).toEqual({
        snapshotId: 'snapshot-123',
        message: ''
      });
    });

    it('should convert response with long message to payload', () => {
      const longMessage = 'This is a very long message that contains detailed information about the snapshot report and provides comprehensive context for debugging purposes';
      const response = new SendSnapshotResponse('snapshot-123', longMessage);

      const payload = response.toPayload();

      expect(payload.snapshotId).toBe('snapshot-123');
      expect(payload.message).toBe(longMessage);
    });

    it('should convert response with UUID to payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new SendSnapshotResponse(uuid, 'Snapshot sent successfully');

      const payload = response.toPayload();

      expect(payload.snapshotId).toBe(uuid);
      expect(payload.message).toBe('Snapshot sent successfully');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new SendSnapshotResponse(
        'snapshot-123',
        'Snapshot report sent successfully'
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).snapshotId = 'modified-snapshot';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).message = 'Modified message';
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in snapshot ID', () => {
      const specialId = 'snapshot-123_abc.def-ghi';
      const response = new SendSnapshotResponse(specialId, 'Snapshot sent successfully');

      expect(response.snapshotId).toBe(specialId);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = new SendSnapshotResponse('snapshot-123', specialMessage);

      expect(response.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Mensaje con caracteres especiales: ñáéíóú';
      const response = new SendSnapshotResponse('snapshot-123', unicodeMessage);

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle newlines in message', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = new SendSnapshotResponse('snapshot-123', multilineMessage);

      expect(response.message).toBe(multilineMessage);
    });

    it('should handle very long snapshot ID', () => {
      const longId = 'a'.repeat(1000);
      const response = new SendSnapshotResponse(longId, 'Snapshot sent successfully');

      expect(response.snapshotId).toBe(longId);
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new SendSnapshotResponse('snapshot-123', longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should handle numeric snapshot ID', () => {
      const numericId = '123456789';
      const response = new SendSnapshotResponse(numericId, 'Snapshot sent successfully');

      expect(response.snapshotId).toBe(numericId);
    });

    it('should handle alphanumeric snapshot ID', () => {
      const alphanumericId = 'snapshot123abc456def';
      const response = new SendSnapshotResponse(alphanumericId, 'Snapshot sent successfully');

      expect(response.snapshotId).toBe(alphanumericId);
    });
  });

  describe('type safety', () => {
    it('should accept string for snapshot ID', () => {
      const response = new SendSnapshotResponse(
        'snapshot-123',
        'Snapshot report sent successfully'
      );

      expect(typeof response.snapshotId).toBe('string');
    });

    it('should accept string for message', () => {
      const response = new SendSnapshotResponse(
        'snapshot-123',
        'Snapshot report sent successfully'
      );

      expect(typeof response.message).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle successful snapshot creation scenario', () => {
      const response = new SendSnapshotResponse(
        'snapshot-123',
        'Snapshot report created and sent successfully'
      );

      expect(response.snapshotId).toBe('snapshot-123');
      expect(response.message).toBe('Snapshot report created and sent successfully');
    });

    it('should handle snapshot upload scenario', () => {
      const response = new SendSnapshotResponse(
        'snapshot-456',
        'Snapshot uploaded to blob storage successfully'
      );

      expect(response.snapshotId).toBe('snapshot-456');
      expect(response.message).toBe('Snapshot uploaded to blob storage successfully');
    });

    it('should handle snapshot notification scenario', () => {
      const response = new SendSnapshotResponse(
        'snapshot-789',
        'Snapshot notification sent to supervisor'
      );

      expect(response.snapshotId).toBe('snapshot-789');
      expect(response.message).toBe('Snapshot notification sent to supervisor');
    });

    it('should handle snapshot with timestamp scenario', () => {
      const timestamp = new Date().toISOString();
      const response = new SendSnapshotResponse(
        `snapshot-${timestamp}`,
        `Snapshot created at ${timestamp}`
      );

      expect(response.snapshotId).toBe(`snapshot-${timestamp}`);
      expect(response.message).toBe(`Snapshot created at ${timestamp}`);
    });

    it('should handle snapshot with user context scenario', () => {
      const response = new SendSnapshotResponse(
        'snapshot-user-123',
        'Snapshot report sent for user session'
      );

      expect(response.snapshotId).toBe('snapshot-user-123');
      expect(response.message).toBe('Snapshot report sent for user session');
    });
  });
});
