import { WebSocketEventRequest } from '../../../src/domain/value-objects/WebSocketEventRequest';
import { Context } from '@azure/functions';

describe('WebSocketEventRequest', () => {
  describe('fromContext', () => {
    it('should parse context with GA format (eventType=System)', () => {
      const mockContext = {
        bindingData: {
          connectionContext: {
            eventType: 'System',
            eventName: 'connect',
            userId: 'user-id',
            connectionId: 'conn-id',
            hub: 'hub-name'
          }
        }
      } as Context;

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.phase).toBe('connect');
      expect(request.userId).toBe('user-id');
      expect(request.connectionId).toBe('conn-id');
      expect(request.hub).toBe('hub-name');
    });

    it('should parse context with Preview format (eventType=connect)', () => {
      const mockContext = {
        bindingData: {
          connectionContext: {
            eventType: 'connect',
            eventName: 'system',
            userId: 'user-id',
            connectionId: 'conn-id',
            hub: 'hub-name'
          }
        }
      } as Context;

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.phase).toBe('connect');
    });

    it('should extract userId from user.id', () => {
      const mockContext = {
        bindingData: {
          connectionContext: {
            eventType: 'System',
            eventName: 'connect',
            user: { id: 'user-from-user-id' },
            connectionId: 'conn-id',
            hub: 'hub-name'
          }
        }
      } as Context;

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('user-from-user-id');
    });

    it('should extract userId from claims.userId', () => {
      const mockContext = {
        bindingData: {
          connectionContext: {
            eventType: 'System',
            eventName: 'connect',
            claims: { userId: 'user-from-claims' },
            connectionId: 'conn-id',
            hub: 'hub-name'
          }
        }
      } as Context;

      const request = WebSocketEventRequest.fromContext(mockContext);

      expect(request.userId).toBe('user-from-claims');
    });
  });
});

