import { AcknowledgeCommandResult } from '../../../../../shared/domain/value-objects/AcknowledgeCommandResult';

describe('AcknowledgeCommandResult', () => {
  describe('constructor', () => {
    it('should create result with valid updated count', () => {
      const result = new AcknowledgeCommandResult(5);

      expect(result.updatedCount).toBe(5);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create result with zero count', () => {
      const result = new AcknowledgeCommandResult(0);

      expect(result.updatedCount).toBe(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for negative count', () => {
      expect(() => {
        new AcknowledgeCommandResult(-1);
      }).toThrow('Updated count cannot be negative');
    });

    it('should throw error for large negative count', () => {
      expect(() => {
        new AcknowledgeCommandResult(-100);
      }).toThrow('Updated count cannot be negative');
    });
  });

  describe('fromDatabaseResult', () => {
    it('should create result from database result', () => {
      const result = AcknowledgeCommandResult.fromDatabaseResult(10);

      expect(result.updatedCount).toBe(10);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create result with zero count', () => {
      const result = AcknowledgeCommandResult.fromDatabaseResult(0);

      expect(result.updatedCount).toBe(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for negative count', () => {
      expect(() => {
        AcknowledgeCommandResult.fromDatabaseResult(-1);
      }).toThrow('Updated count cannot be negative');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const result = new AcknowledgeCommandResult(7);
      const payload = result.toPayload();

      expect(payload).toEqual({
        updatedCount: 7
      });
    });

    it('should convert zero count to payload', () => {
      const result = new AcknowledgeCommandResult(0);
      const payload = result.toPayload();

      expect(payload).toEqual({
        updatedCount: 0
      });
    });

    it('should convert large count to payload', () => {
      const result = new AcknowledgeCommandResult(1000);
      const payload = result.toPayload();

      expect(payload).toEqual({
        updatedCount: 1000
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const result = new AcknowledgeCommandResult(5);
      
      expect(() => {
        (result as any).updatedCount = 10;
      }).toThrow();
      
      expect(() => {
        (result as any).timestamp = new Date();
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum safe integer', () => {
      const result = new AcknowledgeCommandResult(Number.MAX_SAFE_INTEGER);
      expect(result.updatedCount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle decimal numbers', () => {
      const result = new AcknowledgeCommandResult(5.5);
      expect(result.updatedCount).toBe(5.5);
    });

    it('should handle very large numbers', () => {
      const result = new AcknowledgeCommandResult(999999);
      expect(result.updatedCount).toBe(999999);
    });
  });

  describe('timestamp behavior', () => {
    it('should set timestamp on creation', () => {
      const before = new Date();
      const result = new AcknowledgeCommandResult(1);
      const after = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have different timestamps for different instances', async () => {
      const result1 = new AcknowledgeCommandResult(1);
      // Add delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const result2 = new AcknowledgeCommandResult(2);

      expect(result1.timestamp.getTime()).not.toBe(result2.timestamp.getTime());
    });
  });
});