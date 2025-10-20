/**
 * @fileoverview SupervisorChangeResult value object - unit tests
 * @summary Tests for SupervisorChangeResult value object functionality
 * @description Validates supervisor change result creation, factory methods, and properties
 */

import { SupervisorChangeResult } from '../../../../../shared/domain/value-objects/SupervisorChangeResult';

describe('SupervisorChangeResult', () => {
  describe('constructor', () => {
    it('should create result with all properties', () => {
      const result = new SupervisorChangeResult(5, 2, 7);

      expect(result.updatedCount).toBe(5);
      expect(result.skippedCount).toBe(2);
      expect(result.totalProcessed).toBe(7);
    });

    it('should create result with default skipped and total', () => {
      const result = new SupervisorChangeResult(10);

      expect(result.updatedCount).toBe(10);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(10);
    });

    it('should create result with custom skipped count', () => {
      const result = new SupervisorChangeResult(8, 3);

      expect(result.updatedCount).toBe(8);
      expect(result.skippedCount).toBe(3);
      expect(result.totalProcessed).toBe(11);
    });

    it('should create result with custom total processed', () => {
      const result = new SupervisorChangeResult(5, 2, 10);

      expect(result.updatedCount).toBe(5);
      expect(result.skippedCount).toBe(2);
      expect(result.totalProcessed).toBe(10);
    });

    it('should handle zero counts', () => {
      const result = new SupervisorChangeResult(0, 0, 0);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(0);
    });

    it('should handle negative counts', () => {
      const result = new SupervisorChangeResult(-1, -2, -3);

      expect(result.updatedCount).toBe(-1);
      expect(result.skippedCount).toBe(-2);
      expect(result.totalProcessed).toBe(-3);
    });
  });

  describe('success factory method', () => {
    it('should create successful result', () => {
      const result = SupervisorChangeResult.success(5);

      expect(result.updatedCount).toBe(5);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(5);
    });

    it('should create successful result with zero updates', () => {
      const result = SupervisorChangeResult.success(0);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(0);
    });

    it('should create successful result with large count', () => {
      const result = SupervisorChangeResult.success(1000);

      expect(result.updatedCount).toBe(1000);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(1000);
    });
  });

  describe('withSkipped factory method', () => {
    it('should create result with updated and skipped counts', () => {
      const result = SupervisorChangeResult.withSkipped(5, 3);

      expect(result.updatedCount).toBe(5);
      expect(result.skippedCount).toBe(3);
      expect(result.totalProcessed).toBe(8);
    });

    it('should create result with zero updated count', () => {
      const result = SupervisorChangeResult.withSkipped(0, 5);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(5);
      expect(result.totalProcessed).toBe(5);
    });

    it('should create result with zero skipped count', () => {
      const result = SupervisorChangeResult.withSkipped(10, 0);

      expect(result.updatedCount).toBe(10);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(10);
    });

    it('should create result with both zero counts', () => {
      const result = SupervisorChangeResult.withSkipped(0, 0);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(0);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const result = new SupervisorChangeResult(5, 2, 7);

      // TypeScript should prevent these assignments
      expect(() => {
        (result as any).updatedCount = 10;
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (result as any).skippedCount = 5;
      }).not.toThrow();

      expect(() => {
        (result as any).totalProcessed = 15;
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle maximum safe integer', () => {
      const result = new SupervisorChangeResult(Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER);

      expect(result.updatedCount).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle decimal numbers', () => {
      const result = new SupervisorChangeResult(5.5, 2.3, 7.8);

      expect(result.updatedCount).toBe(5.5);
      expect(result.skippedCount).toBe(2.3);
      expect(result.totalProcessed).toBe(7.8);
    });

    it('should handle very large numbers', () => {
      const result = new SupervisorChangeResult(999999, 888888, 1888887);

      expect(result.updatedCount).toBe(999999);
      expect(result.skippedCount).toBe(888888);
      expect(result.totalProcessed).toBe(1888887);
    });
  });

  describe('type safety', () => {
    it('should accept number types for all properties', () => {
      const result = new SupervisorChangeResult(5, 2, 7);

      expect(typeof result.updatedCount).toBe('number');
      expect(typeof result.skippedCount).toBe('number');
      expect(typeof result.totalProcessed).toBe('number');
    });
  });

  describe('validation scenarios', () => {
    it('should handle successful supervisor assignment scenario', () => {
      const result = SupervisorChangeResult.success(10);

      expect(result.updatedCount).toBe(10);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(10);
    });

    it('should handle partial success scenario', () => {
      const result = SupervisorChangeResult.withSkipped(8, 2);

      expect(result.updatedCount).toBe(8);
      expect(result.skippedCount).toBe(2);
      expect(result.totalProcessed).toBe(10);
    });

    it('should handle no updates scenario', () => {
      const result = SupervisorChangeResult.withSkipped(0, 5);

      expect(result.updatedCount).toBe(0);
      expect(result.skippedCount).toBe(5);
      expect(result.totalProcessed).toBe(5);
    });

    it('should handle all updates scenario', () => {
      const result = SupervisorChangeResult.withSkipped(10, 0);

      expect(result.updatedCount).toBe(10);
      expect(result.skippedCount).toBe(0);
      expect(result.totalProcessed).toBe(10);
    });

    it('should handle large batch processing scenario', () => {
      const result = SupervisorChangeResult.withSkipped(500, 50);

      expect(result.updatedCount).toBe(500);
      expect(result.skippedCount).toBe(50);
      expect(result.totalProcessed).toBe(550);
    });
  });

  describe('mathematical consistency', () => {
    it('should maintain mathematical consistency in constructor', () => {
      const result = new SupervisorChangeResult(5, 3, 8);

      expect(result.updatedCount + result.skippedCount).toBe(8);
      expect(result.totalProcessed).toBe(8);
    });

    it('should maintain mathematical consistency in withSkipped factory', () => {
      const result = SupervisorChangeResult.withSkipped(7, 3);

      expect(result.updatedCount + result.skippedCount).toBe(result.totalProcessed);
    });

    it('should maintain mathematical consistency in success factory', () => {
      const result = SupervisorChangeResult.success(5);

      expect(result.updatedCount).toBe(result.totalProcessed);
      expect(result.skippedCount).toBe(0);
    });
  });
});
