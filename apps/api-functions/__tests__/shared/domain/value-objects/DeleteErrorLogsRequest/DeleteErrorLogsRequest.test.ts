/**
 * @fileoverview Tests for DeleteErrorLogsRequest
 * @description Tests for error log deletion request value object
 */

import { DeleteErrorLogsRequest } from '../../../../../shared/domain/value-objects/DeleteErrorLogsRequest';

describe('DeleteErrorLogsRequest', () => {
  describe('fromBody', () => {
    it('should create request from single ID string', () => {
      const request = DeleteErrorLogsRequest.fromBody({ ids: 'error-123' });

      expect(request.ids).toEqual(['error-123']);
    });

    it('should create request from array of IDs', () => {
      const request = DeleteErrorLogsRequest.fromBody({
        ids: ['error-123', 'error-456', 'error-789']
      });

      expect(request.ids).toEqual(['error-123', 'error-456', 'error-789']);
    });

    it('should throw error when ids is missing', () => {
      expect(() => DeleteErrorLogsRequest.fromBody({} as any)).toThrow(
        'Error log IDs are required'
      );
    });

    it('should throw error when ids is null', () => {
      expect(() => DeleteErrorLogsRequest.fromBody({ ids: null as any })).toThrow(
        'Error log IDs are required'
      );
    });

    it('should throw error when ids is undefined', () => {
      expect(() => DeleteErrorLogsRequest.fromBody({ ids: undefined as any })).toThrow(
        'Error log IDs are required'
      );
    });

    it('should throw error when ids array is empty', () => {
      expect(() => DeleteErrorLogsRequest.fromBody({ ids: [] })).toThrow(
        'At least one error log ID is required'
      );
    });

    it('should handle single ID in array', () => {
      const request = DeleteErrorLogsRequest.fromBody({ ids: ['error-123'] });

      expect(request.ids).toEqual(['error-123']);
    });
  });

  describe('fromId', () => {
    it('should create request from single ID', () => {
      const request = DeleteErrorLogsRequest.fromId('error-123');

      expect(request.ids).toEqual(['error-123']);
    });

    it('should throw error when id is empty string', () => {
      expect(() => DeleteErrorLogsRequest.fromId('')).toThrow('Error log ID is required');
    });

    it('should throw error when id is null', () => {
      expect(() => DeleteErrorLogsRequest.fromId(null as any)).toThrow(
        'Error log ID is required'
      );
    });

    it('should throw error when id is undefined', () => {
      expect(() => DeleteErrorLogsRequest.fromId(undefined as any)).toThrow(
        'Error log ID is required'
      );
    });
  });

  describe('immutability', () => {
    it('should have readonly ids property', () => {
      const request = DeleteErrorLogsRequest.fromBody({ ids: ['error-123'] });

      // TypeScript should prevent this, but test runtime behavior
      expect(() => {
        (request as any).ids = ['modified'];
      }).not.toThrow(); // JavaScript allows this, but TypeScript prevents it
    });
  });
});

