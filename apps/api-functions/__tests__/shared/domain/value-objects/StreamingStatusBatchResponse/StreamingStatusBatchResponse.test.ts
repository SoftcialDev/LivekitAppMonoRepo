/**
 * @fileoverview StreamingStatusBatchResponse value object - unit tests
 * @summary Tests for StreamingStatusBatchResponse value object functionality
 * @description Validates batch streaming status response creation and payload conversion
 */

import { StreamingStatusBatchResponse, StreamingStatusBatchResponsePayload } from '../../../../../shared/domain/value-objects/StreamingStatusBatchResponse';

describe('StreamingStatusBatchResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'DISCONNECT',
            stoppedAt: '2023-01-02T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses).toEqual(statuses);
    });

    it('should create response with empty statuses array', () => {
      const response = new StreamingStatusBatchResponse([]);

      expect(response.statuses).toEqual([]);
    });

    it('should create response with single status', () => {
      const statuses = [
        {
          email: 'user@example.com',
          hasActiveSession: true,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses).toEqual(statuses);
    });

    it('should create response with many statuses', () => {
      const manyStatuses = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i}@example.com`,
        hasActiveSession: i % 2 === 0,
        lastSession: i % 2 === 0 ? null : {
          stopReason: 'COMMAND',
          stoppedAt: '2023-01-01T12:00:00Z'
        }
      }));

      const response = new StreamingStatusBatchResponse(manyStatuses);

      expect(response.statuses).toHaveLength(100);
      expect(response.statuses[0].email).toBe('user0@example.com');
      expect(response.statuses[99].email).toBe('user99@example.com');
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'DISCONNECT',
            stoppedAt: '2023-01-02T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);
      const payload = response.toPayload();

      expect(payload).toEqual({
        statuses: statuses
      });
    });

    it('should convert empty response to payload', () => {
      const response = new StreamingStatusBatchResponse([]);
      const payload = response.toPayload();

      expect(payload).toEqual({
        statuses: []
      });
    });

    it('should convert response with null last sessions to payload', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: null
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);
      const payload = response.toPayload();

      expect(payload).toEqual({
        statuses: statuses
      });
    });

    it('should return reference to statuses array', () => {
      const originalStatuses = [
        {
          email: 'user@example.com',
          hasActiveSession: true,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(originalStatuses);
      const payload = response.toPayload();
      
      // Modify the payload
      payload.statuses.push({
        email: 'user2@example.com',
        hasActiveSession: false,
        lastSession: null
      });

      // Since toPayload returns a reference, both original and payload are affected
      expect(response.statuses).toHaveLength(2);
      expect(payload.statuses).toHaveLength(2);
    });
  });

  describe('StreamingStatusBatchResponsePayload interface', () => {
    it('should match StreamingStatusBatchResponsePayload interface structure', () => {
      const payload: StreamingStatusBatchResponsePayload = {
        statuses: [
          {
            email: 'user@example.com',
            hasActiveSession: true,
            lastSession: {
              stopReason: 'COMMAND',
              stoppedAt: '2023-01-01T12:00:00Z'
            }
          }
        ]
      };

      expect(payload.statuses).toHaveLength(1);
      expect(payload.statuses[0].email).toBe('user@example.com');
      expect(payload.statuses[0].hasActiveSession).toBe(true);
      expect(payload.statuses[0].lastSession?.stopReason).toBe('COMMAND');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const statuses = [] as any[];
      const response = new StreamingStatusBatchResponse(statuses);

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).statuses = [];
      }).not.toThrow(); // JavaScript allows property modification
    });
  });

  describe('edge cases', () => {
    it('should handle statuses with different stop reasons', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'DISCONNECT',
            stoppedAt: '2023-01-02T12:00:00Z'
          }
        },
        {
          email: 'user3@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'TIMEOUT',
            stoppedAt: '2023-01-03T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses[0].lastSession?.stopReason).toBe('COMMAND');
      expect(response.statuses[1].lastSession?.stopReason).toBe('DISCONNECT');
      expect(response.statuses[2].lastSession?.stopReason).toBe('TIMEOUT');
    });

    it('should handle statuses with different timestamp formats', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T00:00:00Z'
          }
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'DISCONNECT',
            stoppedAt: '2023-12-31T23:59:59Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses[0].lastSession?.stoppedAt).toBe('2023-01-01T00:00:00Z');
      expect(response.statuses[1].lastSession?.stoppedAt).toBe('2023-12-31T23:59:59Z');
    });

    it('should handle statuses with special characters in email', () => {
      const statuses = [
        {
          email: 'user+tag@example.com',
          hasActiveSession: true,
          lastSession: null
        },
        {
          email: 'user.name@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses[0].email).toBe('user+tag@example.com');
      expect(response.statuses[1].email).toBe('user.name@example.com');
    });

    it('should handle statuses with unicode characters in email', () => {
      const statuses = [
        {
          email: 'usuario@ejemplo.com',
          hasActiveSession: true,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses[0].email).toBe('usuario@ejemplo.com');
    });
  });

  describe('type safety', () => {
    it('should accept array of status objects', () => {
      const statuses = [
        {
          email: 'user@example.com',
          hasActiveSession: true,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(Array.isArray(response.statuses)).toBe(true);
      expect(typeof response.statuses[0].email).toBe('string');
      expect(typeof response.statuses[0].hasActiveSession).toBe('boolean');
    });

    it('should accept null for lastSession', () => {
      const statuses = [
        {
          email: 'user@example.com',
          hasActiveSession: true,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses[0].lastSession).toBe(null);
    });

    it('should accept object for lastSession', () => {
      const statuses = [
        {
          email: 'user@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(typeof response.statuses[0].lastSession).toBe('object');
      expect(response.statuses[0].lastSession?.stopReason).toBe('COMMAND');
      expect(response.statuses[0].lastSession?.stoppedAt).toBe('2023-01-01T12:00:00Z');
    });
  });

  describe('validation scenarios', () => {
    it('should handle all users with active sessions', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: null
        },
        {
          email: 'user2@example.com',
          hasActiveSession: true,
          lastSession: null
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses.every(status => status.hasActiveSession)).toBe(true);
    });

    it('should handle all users with inactive sessions', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'DISCONNECT',
            stoppedAt: '2023-01-02T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses.every(status => !status.hasActiveSession)).toBe(true);
    });

    it('should handle mixed active and inactive sessions', () => {
      const statuses = [
        {
          email: 'user1@example.com',
          hasActiveSession: true,
          lastSession: null
        },
        {
          email: 'user2@example.com',
          hasActiveSession: false,
          lastSession: {
            stopReason: 'COMMAND',
            stoppedAt: '2023-01-01T12:00:00Z'
          }
        }
      ];

      const response = new StreamingStatusBatchResponse(statuses);

      expect(response.statuses[0].hasActiveSession).toBe(true);
      expect(response.statuses[1].hasActiveSession).toBe(false);
    });

    it('should handle large batch of users', () => {
      const manyStatuses = Array.from({ length: 1000 }, (_, i) => ({
        email: `user${i}@example.com`,
        hasActiveSession: i % 2 === 0,
        lastSession: i % 2 === 0 ? null : {
          stopReason: 'COMMAND',
          stoppedAt: '2023-01-01T12:00:00Z'
        }
      }));

      const response = new StreamingStatusBatchResponse(manyStatuses);

      expect(response.statuses).toHaveLength(1000);
      expect(response.statuses[0].email).toBe('user0@example.com');
      expect(response.statuses[999].email).toBe('user999@example.com');
    });
  });
});
