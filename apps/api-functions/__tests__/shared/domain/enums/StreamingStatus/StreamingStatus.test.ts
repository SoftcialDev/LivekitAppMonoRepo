/**
 * @fileoverview StreamingStatus enum - unit tests
 * @summary Tests for streaming status enumeration
 * @description Validates enum values, string representations, and streaming functionality
 */

import { StreamingStatus } from '../../../../../shared/domain/enums/StreamingStatus';

describe('StreamingStatus', () => {
  describe('enum values', () => {
    it('should have Started value', () => {
      expect(StreamingStatus.Started).toBe('started');
    });

    it('should have Stopped value', () => {
      expect(StreamingStatus.Stopped).toBe('stopped');
    });
  });

  describe('enum properties', () => {
    it('should have correct number of enum values', () => {
      const enumValues = Object.values(StreamingStatus);
      expect(enumValues).toHaveLength(2);
    });

    it('should contain all expected values', () => {
      const enumValues = Object.values(StreamingStatus);
      expect(enumValues).toContain('started');
      expect(enumValues).toContain('stopped');
    });
  });

  describe('enum usage', () => {
    it('should be usable in conditional statements', () => {
      const status = StreamingStatus.Started;
      let result: string;

      if (status === StreamingStatus.Started) {
        result = 'streaming';
      } else if (status === StreamingStatus.Stopped) {
        result = 'not-streaming';
      } else {
        result = 'unknown';
      }

      expect(result).toBe('streaming');
    });

    it('should be comparable with string values', () => {
      expect(StreamingStatus.Started === 'started').toBe(true);
      expect(StreamingStatus.Stopped === 'stopped').toBe(true);
    });

    it('should be usable in object keys', () => {
      const statusMap = {
        [StreamingStatus.Started]: 'Stream is active',
        [StreamingStatus.Stopped]: 'Stream is inactive'
      };

      expect(statusMap[StreamingStatus.Started]).toBe('Stream is active');
      expect(statusMap[StreamingStatus.Stopped]).toBe('Stream is inactive');
    });
  });

  describe('streaming functionality', () => {
    it('should support status transitions', () => {
      const canTransition = (from: StreamingStatus, to: StreamingStatus): boolean => {
        if (from === StreamingStatus.Started && to === StreamingStatus.Stopped) return true;
        if (from === StreamingStatus.Stopped && to === StreamingStatus.Started) return true;
        return false;
      };

      expect(canTransition(StreamingStatus.Started, StreamingStatus.Stopped)).toBe(true);
      expect(canTransition(StreamingStatus.Stopped, StreamingStatus.Started)).toBe(true);
      expect(canTransition(StreamingStatus.Started, StreamingStatus.Started)).toBe(false);
    });

    it('should support status validation', () => {
      const isValidStatus = (status: string): boolean => {
        return Object.values(StreamingStatus).includes(status as StreamingStatus);
      };

      expect(isValidStatus('started')).toBe(true);
      expect(isValidStatus('stopped')).toBe(true);
      expect(isValidStatus('invalid')).toBe(false);
    });

    it('should support status checking', () => {
      const isStreaming = (status: StreamingStatus): boolean => {
        return status === StreamingStatus.Started;
      };

      expect(isStreaming(StreamingStatus.Started)).toBe(true);
      expect(isStreaming(StreamingStatus.Stopped)).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should accept valid enum values', () => {
      const validStatuses: StreamingStatus[] = [
        StreamingStatus.Started,
        StreamingStatus.Stopped
      ];

      expect(validStatuses).toHaveLength(2);
    });

    it('should be serializable to JSON', () => {
      const status = StreamingStatus.Started;
      const json = JSON.stringify({ status });
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('started');
    });
  });
});
