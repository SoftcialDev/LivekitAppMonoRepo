/**
 * @fileoverview WebSocketEventSchema - unit tests
 * @summary Tests for WebSocketEventSchema validation functionality
 * @description Validates WebSocketEvent request schema validation
 */

import { webSocketEventSchema, WebSocketEventParams } from '../../../../../shared/domain/schemas/WebSocketEventSchema';

describe('WebSocketEventSchema', () => {
  describe('webSocketEventSchema', () => {
    it('should validate valid connection context', () => {
      const validData = {
        connectionContext: {
          userId: 'user123',
          eventType: 'connect',
          eventName: 'connection'
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBe('connect');
        expect(result.data.connectionContext.eventName).toBe('connection');
      }
    });

    it('should validate connection context with only required fields', () => {
      const validData = {
        connectionContext: {
          userId: 'user123'
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBeUndefined();
        expect(result.data.connectionContext.eventName).toBeUndefined();
      }
    });

    it('should validate connection context with empty string optional fields', () => {
      const validData = {
        connectionContext: {
          userId: 'user123',
          eventType: '',
          eventName: ''
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBe('');
        expect(result.data.connectionContext.eventName).toBe('');
      }
    });

    it('should validate connection context with long strings', () => {
      const validData = {
        connectionContext: {
          userId: 'user123',
          eventType: 'a'.repeat(1000),
          eventName: 'b'.repeat(1000)
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBe('a'.repeat(1000));
        expect(result.data.connectionContext.eventName).toBe('b'.repeat(1000));
      }
    });

    it('should validate connection context with special characters', () => {
      const validData = {
        connectionContext: {
          userId: 'user-123_test@domain.com',
          eventType: 'connect-disconnect',
          eventName: 'event_name'
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user-123_test@domain.com');
        expect(result.data.connectionContext.eventType).toBe('connect-disconnect');
        expect(result.data.connectionContext.eventName).toBe('event_name');
      }
    });

    it('should validate connection context with unicode characters', () => {
      const validData = {
        connectionContext: {
          userId: '用户123',
          eventType: '连接',
          eventName: '事件'
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('用户123');
        expect(result.data.connectionContext.eventType).toBe('连接');
        expect(result.data.connectionContext.eventName).toBe('事件');
      }
    });

    it('should reject empty userId', () => {
      const invalidData = {
        connectionContext: {
          userId: ''
        }
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
        expect(result.error.issues[0].message).toBe('User ID is required');
      }
    });

    it('should reject missing userId', () => {
      const invalidData = {
        connectionContext: {}
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null userId', () => {
      const invalidData = {
        connectionContext: {
          userId: null
        }
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined userId', () => {
      const invalidData = {
        connectionContext: {
          userId: undefined
        }
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject non-string userId', () => {
      const invalidData = {
        connectionContext: {
          userId: 123
        }
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject missing connectionContext', () => {
      const invalidData = {};

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null connectionContext', () => {
      const invalidData = {
        connectionContext: null
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined connectionContext', () => {
      const invalidData = {
        connectionContext: undefined
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject non-object connectionContext', () => {
      const invalidData = {
        connectionContext: 'string'
      };

      const result = webSocketEventSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject null input', () => {
      const result = webSocketEventSchema.safeParse(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject undefined input', () => {
      const result = webSocketEventSchema.safeParse(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject string input', () => {
      const result = webSocketEventSchema.safeParse('string');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject number input', () => {
      const result = webSocketEventSchema.safeParse(123);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject boolean input', () => {
      const result = webSocketEventSchema.safeParse(true);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });

    it('should reject array input', () => {
      const result = webSocketEventSchema.safeParse([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_type');
      }
    });
  });

  describe('WebSocketEventParams type', () => {
    it('should have correct type structure', () => {
      const validData: WebSocketEventParams = {
        connectionContext: {
          userId: 'user123',
          eventType: 'connect',
          eventName: 'connection'
        }
      };

      expect(validData.connectionContext.userId).toBe('user123');
      expect(validData.connectionContext.eventType).toBe('connect');
      expect(validData.connectionContext.eventName).toBe('connection');
    });

    it('should accept minimal connection context', () => {
      const validData: WebSocketEventParams = {
        connectionContext: {
          userId: 'user123'
        }
      };

      expect(validData.connectionContext.userId).toBe('user123');
      expect(validData.connectionContext.eventType).toBeUndefined();
      expect(validData.connectionContext.eventName).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle very long userId', () => {
      const validData = {
        connectionContext: {
          userId: 'a'.repeat(10000)
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('a'.repeat(10000));
      }
    });

    it('should handle very long eventType', () => {
      const validData = {
        connectionContext: {
          userId: 'user123',
          eventType: 'a'.repeat(10000)
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.eventType).toBe('a'.repeat(10000));
      }
    });

    it('should handle very long eventName', () => {
      const validData = {
        connectionContext: {
          userId: 'user123',
          eventName: 'a'.repeat(10000)
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.eventName).toBe('a'.repeat(10000));
      }
    });

    it('should handle connection context with extra properties', () => {
      const validData = {
        connectionContext: {
          userId: 'user123',
          eventType: 'connect',
          eventName: 'connection',
          extraProperty: 'value'
        }
      };

      const result = webSocketEventSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBe('connect');
        expect(result.data.connectionContext.eventName).toBe('connection');
      }
    });
  });

  describe('validation scenarios', () => {
    it('should validate websocket connection event', () => {
      const requestData = {
        connectionContext: {
          userId: 'user123',
          eventType: 'connect',
          eventName: 'connection'
        }
      };

      const result = webSocketEventSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBe('connect');
        expect(result.data.connectionContext.eventName).toBe('connection');
      }
    });

    it('should validate websocket disconnection event', () => {
      const requestData = {
        connectionContext: {
          userId: 'user123',
          eventType: 'disconnect',
          eventName: 'disconnection'
        }
      };

      const result = webSocketEventSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
        expect(result.data.connectionContext.eventType).toBe('disconnect');
        expect(result.data.connectionContext.eventName).toBe('disconnection');
      }
    });

    it('should validate websocket event with minimal data', () => {
      const requestData = {
        connectionContext: {
          userId: 'user123'
        }
      };

      const result = webSocketEventSchema.safeParse(requestData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.connectionContext.userId).toBe('user123');
      }
    });
  });
});

