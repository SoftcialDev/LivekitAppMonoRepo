import { TransferPsosResponse } from '../../../../../shared/domain/value-objects/TransferPsosResponse';

describe('TransferPsosResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new TransferPsosResponse(5, 'PSOs transferred successfully');

      expect(response.movedCount).toBe(5);
      expect(response.message).toBe('PSOs transferred successfully');
    });

    it('should create response with different moved counts', () => {
      const response1 = new TransferPsosResponse(1, 'PSO transferred');
      const response2 = new TransferPsosResponse(10, 'PSOs transferred');

      expect(response1.movedCount).toBe(1);
      expect(response2.movedCount).toBe(10);
    });

    it('should create response with different messages', () => {
      const response1 = new TransferPsosResponse(3, 'Transfer completed');
      const response2 = new TransferPsosResponse(3, 'Transfer successful');

      expect(response1.message).toBe('Transfer completed');
      expect(response2.message).toBe('Transfer successful');
    });

    it('should create response with zero moved count', () => {
      const response = new TransferPsosResponse(0, 'No PSOs to transfer');

      expect(response.movedCount).toBe(0);
      expect(response.message).toBe('No PSOs to transfer');
    });

    it('should create response with empty message', () => {
      const response = new TransferPsosResponse(2, '');

      expect(response.movedCount).toBe(2);
      expect(response.message).toBe('');
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that describes the successful transfer of PSOs with detailed information about the operation';
      const response = new TransferPsosResponse(7, longMessage);

      expect(response.movedCount).toBe(7);
      expect(response.message).toBe(longMessage);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new TransferPsosResponse(5, 'PSOs transferred successfully');
      const payload = response.toPayload();

      expect(payload).toEqual({
        movedCount: 5,
        message: 'PSOs transferred successfully'
      });
    });

    it('should convert response with zero count to payload', () => {
      const response = new TransferPsosResponse(0, 'No PSOs to transfer');
      const payload = response.toPayload();

      expect(payload).toEqual({
        movedCount: 0,
        message: 'No PSOs to transfer'
      });
    });

    it('should convert response with empty message to payload', () => {
      const response = new TransferPsosResponse(2, '');
      const payload = response.toPayload();

      expect(payload).toEqual({
        movedCount: 2,
        message: ''
      });
    });

    it('should convert response with long message to payload', () => {
      const longMessage = 'This is a very long message that describes the successful transfer of PSOs with detailed information about the operation';
      const response = new TransferPsosResponse(7, longMessage);
      const payload = response.toPayload();

      expect(payload).toEqual({
        movedCount: 7,
        message: longMessage
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new TransferPsosResponse(5, 'PSOs transferred successfully');

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).movedCount = 10;
      }).toThrow();

      expect(() => {
        (response as any).message = 'Modified message';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle negative moved count', () => {
      const response = new TransferPsosResponse(-1, 'Error in transfer');

      expect(response.movedCount).toBe(-1);
      expect(response.message).toBe('Error in transfer');
    });

    it('should handle large moved count', () => {
      const largeCount = 1000000;
      const response = new TransferPsosResponse(largeCount, 'Large transfer completed');

      expect(response.movedCount).toBe(largeCount);
    });

    it('should handle decimal moved count', () => {
      const response = new TransferPsosResponse(2.5, 'Partial transfer');

      expect(response.movedCount).toBe(2.5);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Transfer: "PSOs" & completed @ 2024-01-01';
      const response = new TransferPsosResponse(3, specialMessage);

      expect(response.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Transferencia completada: 转移成功';
      const response = new TransferPsosResponse(4, unicodeMessage);

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle newlines in message', () => {
      const multilineMessage = 'PSOs transferred\nSuccessfully completed\nOperation finished';
      const response = new TransferPsosResponse(5, multilineMessage);

      expect(response.message).toBe(multilineMessage);
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new TransferPsosResponse(1, longMessage);

      expect(response.message).toBe(longMessage);
    });
  });

  describe('type safety', () => {
    it('should accept number for movedCount', () => {
      const response = new TransferPsosResponse(5, 'PSOs transferred');
      expect(typeof response.movedCount).toBe('number');
    });

    it('should accept string for message', () => {
      const response = new TransferPsosResponse(5, 'PSOs transferred');
      expect(typeof response.message).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle successful PSO transfer scenario', () => {
      const response = new TransferPsosResponse(3, '3 PSOs successfully transferred to new supervisor');

      expect(response.movedCount).toBe(3);
      expect(response.message).toBe('3 PSOs successfully transferred to new supervisor');
    });

    it('should handle bulk PSO transfer scenario', () => {
      const response = new TransferPsosResponse(15, 'Bulk transfer completed - 15 PSOs moved');

      expect(response.movedCount).toBe(15);
      expect(response.message).toBe('Bulk transfer completed - 15 PSOs moved');
    });

    it('should handle no PSOs to transfer scenario', () => {
      const response = new TransferPsosResponse(0, 'No PSOs found for transfer');

      expect(response.movedCount).toBe(0);
      expect(response.message).toBe('No PSOs found for transfer');
    });

    it('should handle partial transfer scenario', () => {
      const response = new TransferPsosResponse(2, '2 out of 5 PSOs transferred successfully');

      expect(response.movedCount).toBe(2);
      expect(response.message).toBe('2 out of 5 PSOs transferred successfully');
    });

    it('should handle transfer with timestamp scenario', () => {
      const timestamp = new Date().toISOString();
      const response = new TransferPsosResponse(4, `Transfer completed at ${timestamp}`);

      expect(response.movedCount).toBe(4);
      expect(response.message).toBe(`Transfer completed at ${timestamp}`);
    });
  });
});
