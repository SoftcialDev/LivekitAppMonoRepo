import { AcknowledgeCommandResult } from '../../../src/domain/value-objects/AcknowledgeCommandResult';
import { ValidationError } from '../../../src/domain/errors/DomainError';

describe('AcknowledgeCommandResult', () => {
  describe('constructor', () => {
    it('should throw ValidationError when updatedCount is negative', () => {
      expect(() => {
        new AcknowledgeCommandResult(-1);
      }).toThrow(ValidationError);
    });

    it('should create result with valid count', () => {
      const result = new AcknowledgeCommandResult(5);
      expect(result.updatedCount).toBe(5);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('fromDatabaseResult', () => {
    it('should create result from database result', () => {
      const result = AcknowledgeCommandResult.fromDatabaseResult(3);
      expect(result.updatedCount).toBe(3);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const result = new AcknowledgeCommandResult(10);
      const payload = result.toPayload();
      expect(payload).toEqual({
        updatedCount: 10
      });
    });
  });
});


