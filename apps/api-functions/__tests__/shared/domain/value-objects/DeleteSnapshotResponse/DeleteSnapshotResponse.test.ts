import { DeleteSnapshotResponse } from '../../../../../shared/domain/value-objects/DeleteSnapshotResponse';

describe('DeleteSnapshotResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new DeleteSnapshotResponse(
        'snapshot-123',
        'Snapshot deleted successfully'
      );

      expect(response.deletedId).toBe('snapshot-123');
      expect(response.message).toBe('Snapshot deleted successfully');
    });

    it('should create response with different snapshot IDs', () => {
      const response1 = new DeleteSnapshotResponse('snapshot-1', 'Deleted');
      const response2 = new DeleteSnapshotResponse('snapshot-2', 'Deleted');

      expect(response1.deletedId).toBe('snapshot-1');
      expect(response2.deletedId).toBe('snapshot-2');
    });

    it('should create response with different messages', () => {
      const response1 = new DeleteSnapshotResponse('snapshot-123', 'Success');
      const response2 = new DeleteSnapshotResponse('snapshot-123', 'Completed');

      expect(response1.message).toBe('Success');
      expect(response2.message).toBe('Completed');
    });

    it('should create response with empty message', () => {
      const response = new DeleteSnapshotResponse('snapshot-123', '');

      expect(response.deletedId).toBe('snapshot-123');
      expect(response.message).toBe('');
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that describes the successful deletion of the snapshot with detailed information about the operation';
      const response = new DeleteSnapshotResponse('snapshot-123', longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should create response with UUID snapshot ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new DeleteSnapshotResponse(uuid, 'Deleted');

      expect(response.deletedId).toBe(uuid);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new DeleteSnapshotResponse(
        'snapshot-123',
        'Snapshot deleted successfully'
      );
      const payload = response.toPayload();

      expect(payload).toEqual({
        deletedId: 'snapshot-123',
        message: 'Snapshot deleted successfully'
      });
    });

    it('should convert response with empty message to payload', () => {
      const response = new DeleteSnapshotResponse('snapshot-123', '');
      const payload = response.toPayload();

      expect(payload).toEqual({
        deletedId: 'snapshot-123',
        message: ''
      });
    });

    it('should convert response with long message to payload', () => {
      const longMessage = 'This is a very long message that describes the successful deletion of the snapshot with detailed information about the operation';
      const response = new DeleteSnapshotResponse('snapshot-123', longMessage);
      const payload = response.toPayload();

      expect(payload).toEqual({
        deletedId: 'snapshot-123',
        message: longMessage
      });
    });

    it('should convert response with UUID to payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new DeleteSnapshotResponse(uuid, 'Deleted');
      const payload = response.toPayload();

      expect(payload).toEqual({
        deletedId: uuid,
        message: 'Deleted'
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new DeleteSnapshotResponse(
        'snapshot-123',
        'Snapshot deleted successfully'
      );

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).deletedId = 'modified-id';
      }).toThrow();

      expect(() => {
        (response as any).message = 'Modified message';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in snapshot ID', () => {
      const specialId = 'snapshot-123!@#$%^&*()';
      const response = new DeleteSnapshotResponse(specialId, 'Deleted');

      expect(response.deletedId).toBe(specialId);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Deleted: "Snapshot" & completed @ 2024-01-01';
      const response = new DeleteSnapshotResponse('snapshot-123', specialMessage);

      expect(response.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Snapshot eliminado: 删除成功';
      const response = new DeleteSnapshotResponse('snapshot-123', unicodeMessage);

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle newlines in message', () => {
      const multilineMessage = 'Snapshot deleted\nSuccessfully completed\nOperation finished';
      const response = new DeleteSnapshotResponse('snapshot-123', multilineMessage);

      expect(response.message).toBe(multilineMessage);
    });

    it('should handle very long snapshot ID', () => {
      const longId = 'snapshot-' + 'a'.repeat(1000);
      const response = new DeleteSnapshotResponse(longId, 'Deleted');

      expect(response.deletedId).toBe(longId);
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new DeleteSnapshotResponse('snapshot-123', longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should handle numeric snapshot ID', () => {
      const numericId = '123456789';
      const response = new DeleteSnapshotResponse(numericId, 'Deleted');

      expect(response.deletedId).toBe(numericId);
    });

    it('should handle alphanumeric snapshot ID', () => {
      const alphanumericId = 'snap123abc456def';
      const response = new DeleteSnapshotResponse(alphanumericId, 'Deleted');

      expect(response.deletedId).toBe(alphanumericId);
    });
  });

  describe('type safety', () => {
    it('should accept string for deletedId', () => {
      const response = new DeleteSnapshotResponse('snapshot-123', 'Deleted');
      expect(typeof response.deletedId).toBe('string');
    });

    it('should accept string for message', () => {
      const response = new DeleteSnapshotResponse('snapshot-123', 'Deleted');
      expect(typeof response.message).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle successful snapshot deletion scenario', () => {
      const response = new DeleteSnapshotResponse(
        'snapshot-abc123',
        'Snapshot successfully deleted from storage'
      );

      expect(response.deletedId).toBe('snapshot-abc123');
      expect(response.message).toBe('Snapshot successfully deleted from storage');
    });

    it('should handle snapshot upload scenario', () => {
      const response = new DeleteSnapshotResponse(
        'upload-snapshot-xyz789',
        'Upload snapshot deleted and cleaned up'
      );

      expect(response.deletedId).toBe('upload-snapshot-xyz789');
      expect(response.message).toBe('Upload snapshot deleted and cleaned up');
    });

    it('should handle snapshot notification scenario', () => {
      const response = new DeleteSnapshotResponse(
        'notification-snapshot-456',
        'Notification snapshot removed from system'
      );

      expect(response.deletedId).toBe('notification-snapshot-456');
      expect(response.message).toBe('Notification snapshot removed from system');
    });

    it('should handle snapshot with timestamp scenario', () => {
      const timestamp = new Date().toISOString();
      const response = new DeleteSnapshotResponse(
        `snapshot-${timestamp}`,
        `Snapshot from ${timestamp} has been deleted`
      );

      expect(response.deletedId).toBe(`snapshot-${timestamp}`);
      expect(response.message).toBe(`Snapshot from ${timestamp} has been deleted`);
    });

    it('should handle snapshot with user context scenario', () => {
      const response = new DeleteSnapshotResponse(
        'user-snapshot-123',
        'User snapshot deleted after session ended'
      );

      expect(response.deletedId).toBe('user-snapshot-123');
      expect(response.message).toBe('User snapshot deleted after session ended');
    });
  });
});
