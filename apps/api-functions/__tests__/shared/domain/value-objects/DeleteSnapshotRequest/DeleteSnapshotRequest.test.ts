import { DeleteSnapshotRequest } from '../../../../../shared/domain/value-objects/DeleteSnapshotRequest';
import { DeleteSnapshotParams } from '../../../../../shared/domain/schemas/DeleteSnapshotSchema';

describe('DeleteSnapshotRequest', () => {
  describe('constructor', () => {
    it('should create request with valid caller ID and snapshot ID', () => {
      const request = new DeleteSnapshotRequest('caller-123', 'snapshot-456');

      expect(request.callerId).toBe('caller-123');
      expect(request.snapshotId).toBe('snapshot-456');
    });

    it('should handle different ID formats', () => {
      const callerIds = [
        'caller-123',
        'azure-ad-object-id',
        'user-456',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000'
      ];

      const snapshotIds = [
        'snapshot-123',
        'snap-456',
        'image-789',
        'uuid-format-987e6543-e21b-43d2-a654-321987654321'
      ];

      callerIds.forEach(callerId => {
        snapshotIds.forEach(snapshotId => {
          const request = new DeleteSnapshotRequest(callerId, snapshotId);
          expect(request.callerId).toBe(callerId);
          expect(request.snapshotId).toBe(snapshotId);
        });
      });
    });
  });

  describe('fromParams', () => {
    it('should create request from valid caller ID and params', () => {
      const callerId = 'caller-123';
      const params: DeleteSnapshotParams = {
        id: 'snapshot-456'
      };

      const request = DeleteSnapshotRequest.fromParams(callerId, params);

      expect(request.callerId).toBe('caller-123');
      expect(request.snapshotId).toBe('snapshot-456');
    });

    it('should handle different ID formats from params', () => {
      const callerIds = [
        'caller-123',
        'azure-ad-object-id',
        'user-456',
        'uuid-format-123e4567-e89b-12d3-a456-426614174000'
      ];

      const snapshotIds = [
        'snapshot-123',
        'snap-456',
        'image-789',
        'uuid-format-987e6543-e21b-43d2-a654-321987654321'
      ];

      callerIds.forEach(callerId => {
        snapshotIds.forEach(snapshotId => {
          const params: DeleteSnapshotParams = { id: snapshotId };
          const request = DeleteSnapshotRequest.fromParams(callerId, params);
          expect(request.callerId).toBe(callerId);
          expect(request.snapshotId).toBe(snapshotId);
        });
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const request = new DeleteSnapshotRequest('caller-123', 'snapshot-456');

      // Freeze the object to prevent runtime modifications
      Object.freeze(request);

      expect(() => {
        (request as any).callerId = 'modified-caller-id';
      }).toThrow();

      expect(() => {
        (request as any).snapshotId = 'modified-snapshot-id';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty caller ID string', () => {
      const request = new DeleteSnapshotRequest('', 'snapshot-456');
      expect(request.callerId).toBe('');
      expect(request.snapshotId).toBe('snapshot-456');
    });

    it('should handle empty snapshot ID string', () => {
      const request = new DeleteSnapshotRequest('caller-123', '');
      expect(request.callerId).toBe('caller-123');
      expect(request.snapshotId).toBe('');
    });

    it('should handle long ID strings', () => {
      const longCallerId = 'caller-' + 'a'.repeat(100);
      const longSnapshotId = 'snapshot-' + 'b'.repeat(100);
      const request = new DeleteSnapshotRequest(longCallerId, longSnapshotId);
      expect(request.callerId).toBe(longCallerId);
      expect(request.snapshotId).toBe(longSnapshotId);
    });

    it('should handle special characters in IDs', () => {
      const specialCallerId = 'caller-123_test.456@domain';
      const specialSnapshotId = 'snapshot-789_test.012@domain';
      const request = new DeleteSnapshotRequest(specialCallerId, specialSnapshotId);
      expect(request.callerId).toBe(specialCallerId);
      expect(request.snapshotId).toBe(specialSnapshotId);
    });

    it('should handle numeric IDs', () => {
      const numericCallerId = '123456789';
      const numericSnapshotId = '987654321';
      const request = new DeleteSnapshotRequest(numericCallerId, numericSnapshotId);
      expect(request.callerId).toBe(numericCallerId);
      expect(request.snapshotId).toBe(numericSnapshotId);
    });

    it('should handle UUID format IDs', () => {
      const uuidCallerId = '123e4567-e89b-12d3-a456-426614174000';
      const uuidSnapshotId = '987e6543-e21b-43d2-a654-321987654321';
      const request = new DeleteSnapshotRequest(uuidCallerId, uuidSnapshotId);
      expect(request.callerId).toBe(uuidCallerId);
      expect(request.snapshotId).toBe(uuidSnapshotId);
    });
  });
});
