import { SnapshotProcessingError } from '../../../src/domain/errors/SnapshotErrors';

describe('SnapshotErrors', () => {
  describe('SnapshotProcessingError', () => {
    it('should create error with original error', () => {
      const originalError = new Error('Original error');
      const error = new SnapshotProcessingError('Processing failed', originalError);

      expect(error.message).toBe('Processing failed');
      expect(error.originalError).toBe(originalError);
    });

    it('should create error without original error', () => {
      const error = new SnapshotProcessingError('Processing failed');

      expect(error.message).toBe('Processing failed');
      expect(error.originalError).toBeUndefined();
    });
  });
});





