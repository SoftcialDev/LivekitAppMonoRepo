/**
 * @fileoverview CommandAcknowledgmentStatus enum - unit tests
 * @summary Tests for command acknowledgment status enumeration
 * @description Validates enum values, string representations, and type safety
 */

import { CommandAcknowledgmentStatus } from '../../../../../shared/domain/enums/CommandAcknowledgmentStatus';

describe('CommandAcknowledgmentStatus', () => {
  describe('enum values', () => {
    it('should have PENDING value', () => {
      expect(CommandAcknowledgmentStatus.PENDING).toBe('PENDING');
    });

    it('should have ACKNOWLEDGED value', () => {
      expect(CommandAcknowledgmentStatus.ACKNOWLEDGED).toBe('ACKNOWLEDGED');
    });

    it('should have FAILED value', () => {
      expect(CommandAcknowledgmentStatus.FAILED).toBe('FAILED');
    });
  });

  describe('enum properties', () => {
    it('should have correct number of enum values', () => {
      const enumValues = Object.values(CommandAcknowledgmentStatus);
      expect(enumValues).toHaveLength(3);
    });

    it('should contain all expected values', () => {
      const enumValues = Object.values(CommandAcknowledgmentStatus);
      expect(enumValues).toContain('PENDING');
      expect(enumValues).toContain('ACKNOWLEDGED');
      expect(enumValues).toContain('FAILED');
    });
  });

  describe('enum usage', () => {
    it('should be usable in conditional statements', () => {
      const status = CommandAcknowledgmentStatus.PENDING;
      let result: string;

      if (status === CommandAcknowledgmentStatus.PENDING) {
        result = 'pending';
      } else if (status === CommandAcknowledgmentStatus.ACKNOWLEDGED) {
        result = 'acknowledged';
      } else if (status === CommandAcknowledgmentStatus.FAILED) {
        result = 'failed';
      } else {
        result = 'unknown';
      }

      expect(result).toBe('pending');
    });

    it('should be comparable with string values', () => {
      expect(CommandAcknowledgmentStatus.PENDING === 'PENDING').toBe(true);
      expect(CommandAcknowledgmentStatus.ACKNOWLEDGED === 'ACKNOWLEDGED').toBe(true);
      expect(CommandAcknowledgmentStatus.FAILED === 'FAILED').toBe(true);
    });

    it('should be usable in object keys', () => {
      const statusMap = {
        [CommandAcknowledgmentStatus.PENDING]: 'Command is pending',
        [CommandAcknowledgmentStatus.ACKNOWLEDGED]: 'Command acknowledged',
        [CommandAcknowledgmentStatus.FAILED]: 'Command failed'
      };

      expect(statusMap[CommandAcknowledgmentStatus.PENDING]).toBe('Command is pending');
      expect(statusMap[CommandAcknowledgmentStatus.ACKNOWLEDGED]).toBe('Command acknowledged');
      expect(statusMap[CommandAcknowledgmentStatus.FAILED]).toBe('Command failed');
    });
  });

  describe('type safety', () => {
    it('should accept valid enum values', () => {
      const validStatuses: CommandAcknowledgmentStatus[] = [
        CommandAcknowledgmentStatus.PENDING,
        CommandAcknowledgmentStatus.ACKNOWLEDGED,
        CommandAcknowledgmentStatus.FAILED
      ];

      expect(validStatuses).toHaveLength(3);
    });

    it('should be serializable to JSON', () => {
      const status = CommandAcknowledgmentStatus.PENDING;
      const json = JSON.stringify({ status });
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('PENDING');
    });
  });
});
