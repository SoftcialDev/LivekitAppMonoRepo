import { DeleteErrorLogsRequest } from '../../../src/domain/value-objects/DeleteErrorLogsRequest';
import { ValidationError } from '../../../src/domain/errors/DomainError';

describe('DeleteErrorLogsRequest', () => {
  describe('fromBody', () => {
    it('should throw ValidationError when ids is missing and deleteAll is false', () => {
      expect(() => {
        DeleteErrorLogsRequest.fromBody({});
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError when ids array is empty', () => {
      expect(() => {
        DeleteErrorLogsRequest.fromBody({ ids: [] });
      }).toThrow(ValidationError);
    });

    it('should create request with deleteAll flag', () => {
      const request = DeleteErrorLogsRequest.fromBody({ deleteAll: true });
      expect(request.deleteAll).toBe(true);
      expect(request.ids).toEqual([]);
    });

    it('should create request with single id string', () => {
      const request = DeleteErrorLogsRequest.fromBody({ ids: 'id-1' });
      expect(request.deleteAll).toBe(false);
      expect(request.ids).toEqual(['id-1']);
    });

    it('should create request with array of ids', () => {
      const request = DeleteErrorLogsRequest.fromBody({ ids: ['id-1', 'id-2'] });
      expect(request.deleteAll).toBe(false);
      expect(request.ids).toEqual(['id-1', 'id-2']);
    });
  });

  describe('fromId', () => {
    it('should throw ValidationError when id is empty', () => {
      expect(() => {
        DeleteErrorLogsRequest.fromId('');
      }).toThrow(ValidationError);
    });

    it('should create request from single id', () => {
      const request = DeleteErrorLogsRequest.fromId('id-1');
      expect(request.deleteAll).toBe(false);
      expect(request.ids).toEqual(['id-1']);
    });
  });
});


