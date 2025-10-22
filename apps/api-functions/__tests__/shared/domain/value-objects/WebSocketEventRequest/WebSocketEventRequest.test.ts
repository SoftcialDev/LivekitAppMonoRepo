import { WebSocketEventRequest } from '../../../../../shared/domain/value-objects/WebSocketEventRequest';
import { Context } from '@azure/functions';
import { TestHelpers } from '../../../../utils/helpers';

describe('WebSocketEventRequest', () => {
  describe('constructor', () => {
    it('should create request with all properties', () => {
      const raw = { eventType: 'connect', userId: 'user123' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(request.userId).toBe('user123');
      expect(request.connectionId).toBe('conn456');
      expect(request.hub).toBe('hub789');
      expect(request.phase).toBe('connect');
      expect(request.raw).toBe(raw);
    });

    it('should handle different phase types', () => {
      const raw = { eventType: 'connected' };
      const request1 = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connected',
        raw
      );
      const request2 = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'disconnected',
        raw
      );
      const request3 = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'user',
        raw
      );

      expect(request1.phase).toBe('connected');
      expect(request2.phase).toBe('disconnected');
      expect(request3.phase).toBe('user');
    });

    it('should handle empty phase', () => {
      const raw = { eventType: '' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        '',
        raw
      );

      expect(request.phase).toBe('');
    });

    it('should handle different user ID formats', () => {
      const raw = { userId: 'user123' };
      const request1 = new WebSocketEventRequest(
        'user-abc',
        'conn456',
        'hub789',
        'connect',
        raw
      );
      const request2 = new WebSocketEventRequest(
        'user-xyz',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(request1.userId).toBe('user-abc');
      expect(request2.userId).toBe('user-xyz');
    });

    it('should handle different connection ID formats', () => {
      const raw = { connectionId: 'conn456' };
      const request1 = new WebSocketEventRequest(
        'user123',
        'conn-abc',
        'hub789',
        'connect',
        raw
      );
      const request2 = new WebSocketEventRequest(
        'user123',
        'conn-xyz',
        'hub789',
        'connect',
        raw
      );

      expect(request1.connectionId).toBe('conn-abc');
      expect(request2.connectionId).toBe('conn-xyz');
    });

    it('should handle different hub names', () => {
      const raw = { hub: 'hub789' };
      const request1 = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub-abc',
        'connect',
        raw
      );
      const request2 = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub-xyz',
        'connect',
        raw
      );

      expect(request1.hub).toBe('hub-abc');
      expect(request2.hub).toBe('hub-xyz');
    });
  });

  describe('fromContext', () => {
    it('should create request from GA format context', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'System',
            eventName: 'connect',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('user123');
      expect(request.connectionId).toBe('conn456');
      expect(request.hub).toBe('hub789');
      expect(request.phase).toBe('connect');
    });

    it('should create request from Preview format context', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'connected',
            eventName: 'system',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('user123');
      expect(request.connectionId).toBe('conn456');
      expect(request.hub).toBe('hub789');
      expect(request.phase).toBe('connected');
    });

    it('should handle user event type', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'user',
            eventName: 'system',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.phase).toBe('user');
    });

    it('should handle disconnected event', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'disconnected',
            eventName: 'system',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.phase).toBe('disconnected');
    });

    it('should normalize case for eventType and eventName', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'SYSTEM',
            eventName: 'CONNECT',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.phase).toBe('connect');
    });

    it('should handle userId from different locations', () => {
      const mockContext1 = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'system',
            eventName: 'connect',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const mockContext2 = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'system',
            eventName: 'connect',
            user: { id: 'user456' },
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const mockContext3 = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'system',
            eventName: 'connect',
            claims: { userId: 'user789' },
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request1 = WebSocketEventRequest.fromContext(mockContext1);
      const request2 = WebSocketEventRequest.fromContext(mockContext2);
      const request3 = WebSocketEventRequest.fromContext(mockContext3);

      expect(request1.userId).toBe('user123');
      expect(request2.userId).toBe('user456');
      expect(request3.userId).toBe('user789');
    });

    it('should normalize userId to lowercase and trim', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'system',
            eventName: 'connect',
            userId: '  USER123  ',
            connectionId: 'conn456',
            hub: 'hub789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('user123');
    });

    it('should handle missing connectionContext', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id'
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('');
      expect(request.connectionId).toBe('');
      expect(request.hub).toBe('');
      expect(request.phase).toBe('');
    });

    it('should handle null/undefined values', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: null,
            eventName: undefined,
            userId: null,
            connectionId: undefined,
            hub: null
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('');
      expect(request.connectionId).toBe('');
      expect(request.hub).toBe('');
      expect(request.phase).toBe('');
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(() => {
        (request as any).userId = 'other-user';
      }).toThrow();
      expect(() => {
        (request as any).connectionId = 'other-conn';
      }).toThrow();
      expect(() => {
        (request as any).hub = 'other-hub';
      }).toThrow();
      expect(() => {
        (request as any).phase = 'other-phase';
      }).toThrow();
      expect(() => {
        (request as any).raw = {};
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const raw = {};
      const request = new WebSocketEventRequest(
        '',
        '',
        '',
        '',
        raw
      );

      expect(request.userId).toBe('');
      expect(request.connectionId).toBe('');
      expect(request.hub).toBe('');
      expect(request.phase).toBe('');
    });

    it('should handle special characters in IDs', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        'user-123!@#$%',
        'conn-456!@#$%',
        'hub-789!@#$%',
        'connect',
        raw
      );

      expect(request.userId).toBe('user-123!@#$%');
      expect(request.connectionId).toBe('conn-456!@#$%');
      expect(request.hub).toBe('hub-789!@#$%');
    });

    it('should handle unicode characters', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        '用户-123',
        '连接-456',
        '中心-789',
        'connect',
        raw
      );

      expect(request.userId).toBe('用户-123');
      expect(request.connectionId).toBe('连接-456');
      expect(request.hub).toBe('中心-789');
    });

    it('should handle long strings', () => {
      const raw = { eventType: 'connect' };
      const longUserId = 'user-' + 'x'.repeat(100);
      const longConnectionId = 'conn-' + 'y'.repeat(100);
      const longHub = 'hub-' + 'z'.repeat(100);

      const request = new WebSocketEventRequest(
        longUserId,
        longConnectionId,
        longHub,
        'connect',
        raw
      );

      expect(request.userId).toBe(longUserId);
      expect(request.connectionId).toBe(longConnectionId);
      expect(request.hub).toBe(longHub);
    });

    it('should handle complex raw data', () => {
      const complexRaw = {
        eventType: 'system',
        eventName: 'connect',
        userId: 'user123',
        connectionId: 'conn456',
        hub: 'hub789',
        metadata: {
          timestamp: '2023-12-01T10:00:00Z',
          source: 'websocket',
          version: '1.0'
        },
        claims: {
          userId: 'user123',
          role: 'admin'
        }
      };

      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        complexRaw
      );

      expect(request.raw).toBe(complexRaw);
    });
  });

  describe('type safety', () => {
    it('should accept string for userId', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(typeof request.userId).toBe('string');
    });

    it('should accept string for connectionId', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(typeof request.connectionId).toBe('string');
    });

    it('should accept string for hub', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(typeof request.hub).toBe('string');
    });

    it('should accept WebSocketPhase for phase', () => {
      const raw = { eventType: 'connect' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(['connect', 'connected', 'disconnected', 'user', '']).toContain(request.phase);
    });

    it('should accept Record<string, any> for raw', () => {
      const raw = { eventType: 'connect', userId: 'user123' };
      const request = new WebSocketEventRequest(
        'user123',
        'conn456',
        'hub789',
        'connect',
        raw
      );

      expect(typeof request.raw).toBe('object');
    });
  });

  describe('validation scenarios', () => {
    it('should handle WebSocket connection scenario', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'System',
            eventName: 'connect',
            userId: 'pso-123',
            connectionId: 'conn-456',
            hub: 'monitoring-hub'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('pso-123');
      expect(request.connectionId).toBe('conn-456');
      expect(request.hub).toBe('monitoring-hub');
      expect(request.phase).toBe('connect');
    });

    it('should handle WebSocket disconnection scenario', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'disconnected',
            eventName: 'system',
            userId: 'supervisor-456',
            connectionId: 'conn-789',
            hub: 'admin-hub'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('supervisor-456');
      expect(request.connectionId).toBe('conn-789');
      expect(request.hub).toBe('admin-hub');
      expect(request.phase).toBe('disconnected');
    });

    it('should handle user event scenario', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'user',
            eventName: 'system',
            userId: 'admin-789',
            connectionId: 'conn-101',
            hub: 'management-hub'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('admin-789');
      expect(request.connectionId).toBe('conn-101');
      expect(request.hub).toBe('management-hub');
      expect(request.phase).toBe('user');
    });

    it('should handle different hub scenarios', () => {
      const mockContext1 = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'system',
            eventName: 'connect',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'production-hub'
          }
        }
      });

      const mockContext2 = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'system',
            eventName: 'connect',
            userId: 'user123',
            connectionId: 'conn456',
            hub: 'staging-hub'
          }
        }
      });

      const request1 = WebSocketEventRequest.fromContext(mockContext1);
      const request2 = WebSocketEventRequest.fromContext(mockContext2);

      expect(request1.hub).toBe('production-hub');
      expect(request2.hub).toBe('staging-hub');
    });

    it('should handle Azure Functions context normalization scenario', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {
            eventType: 'SYSTEM',
            eventName: 'CONNECTED',
            userId: '  USER123  ',
            connectionId: 'CONN456',
            hub: 'HUB789'
          }
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('user123');
      expect(request.connectionId).toBe('CONN456');
      expect(request.hub).toBe('HUB789');
      expect(request.phase).toBe('connected');
    });

    it('should handle missing data scenario', () => {
      const mockContext = TestHelpers.createMockContext({
        bindingData: {
          invocationId: 'test-invocation-id',
          connectionContext: {}
        }
      });

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('');
      expect(request.connectionId).toBe('');
      expect(request.hub).toBe('');
      expect(request.phase).toBe('');
    });
  });
});
