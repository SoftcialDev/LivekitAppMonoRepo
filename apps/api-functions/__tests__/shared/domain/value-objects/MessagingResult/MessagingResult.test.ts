import { MessagingResult } from '../../../../../shared/domain/value-objects/MessagingResult';
import { MessagingChannel } from '../../../../../shared/domain/enums/MessagingChannel';

describe('MessagingResult', () => {
  describe('constructor', () => {
    it('should create result with all properties', () => {
      const result = new MessagingResult(
        MessagingChannel.WebSocket,
        true,
        'Message sent successfully'
      );

      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(true);
      expect(result.error).toBe('Message sent successfully');
    });

    it('should create result without error', () => {
      const result = new MessagingResult(
        MessagingChannel.ServiceBus,
        true
      );

      expect(result.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should create failed result', () => {
      const result = new MessagingResult(
        MessagingChannel.WebSocket,
        false,
        'Connection failed'
      );

      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('webSocketSuccess factory method', () => {
    it('should create successful WebSocket result', () => {
      const result = MessagingResult.webSocketSuccess();

      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should create multiple instances', () => {
      const result1 = MessagingResult.webSocketSuccess();
      const result2 = MessagingResult.webSocketSuccess();

      expect(result1).not.toBe(result2); // Different instances
      expect(result1.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result2.sentVia).toBe(MessagingChannel.WebSocket);
    });
  });

  describe('serviceBusSuccess factory method', () => {
    it('should create successful Service Bus result', () => {
      const result = MessagingResult.serviceBusSuccess();

      expect(result.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should create multiple instances', () => {
      const result1 = MessagingResult.serviceBusSuccess();
      const result2 = MessagingResult.serviceBusSuccess();

      expect(result1).not.toBe(result2); // Different instances
      expect(result1.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result2.sentVia).toBe(MessagingChannel.ServiceBus);
    });
  });

  describe('failure factory method', () => {
    it('should create failed WebSocket result', () => {
      const errorMessage = 'WebSocket connection failed';
      const result = MessagingResult.failure(MessagingChannel.WebSocket, errorMessage);

      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should create failed Service Bus result', () => {
      const errorMessage = 'Service Bus queue unavailable';
      const result = MessagingResult.failure(MessagingChannel.ServiceBus, errorMessage);

      expect(result.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle different error messages', () => {
      const errorMessages = [
        'Connection timeout',
        'Authentication failed',
        'Queue full',
        'Network error'
      ];

      errorMessages.forEach(errorMessage => {
        const result = MessagingResult.failure(MessagingChannel.WebSocket, errorMessage);
        expect(result.error).toBe(errorMessage);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const result = new MessagingResult(
        MessagingChannel.WebSocket,
        true,
        'Test message'
      );

      // Freeze the object to prevent runtime modifications
      Object.freeze(result);

      expect(() => {
        (result as any).sentVia = MessagingChannel.ServiceBus;
      }).toThrow();

      expect(() => {
        (result as any).success = false;
      }).toThrow();

      expect(() => {
        (result as any).error = 'Modified error';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty error message', () => {
      const result = new MessagingResult(
        MessagingChannel.WebSocket,
        false,
        ''
      );

      expect(result.error).toBe('');
      expect(result.success).toBe(false);
    });

    it('should handle long error message', () => {
      const longError = 'A'.repeat(1000);
      const result = new MessagingResult(
        MessagingChannel.ServiceBus,
        false,
        longError
      );

      expect(result.error).toBe(longError);
    });

    it('should handle special characters in error message', () => {
      const specialError = 'Error: "Connection failed" & timeout occurred @ 2024-01-01';
      const result = new MessagingResult(
        MessagingChannel.WebSocket,
        false,
        specialError
      );

      expect(result.error).toBe(specialError);
    });

    it('should handle unicode characters in error message', () => {
      const unicodeError = 'Erro de conexão: 连接失败';
      const result = new MessagingResult(
        MessagingChannel.ServiceBus,
        false,
        unicodeError
      );

      expect(result.error).toBe(unicodeError);
    });
  });

  describe('usage scenarios', () => {
    it('should handle WebSocket success scenario', () => {
      const result = MessagingResult.webSocketSuccess();

      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle Service Bus success scenario', () => {
      const result = MessagingResult.serviceBusSuccess();

      expect(result.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle WebSocket failure scenario', () => {
      const result = MessagingResult.failure(
        MessagingChannel.WebSocket,
        'WebSocket connection lost'
      );

      expect(result.sentVia).toBe(MessagingChannel.WebSocket);
      expect(result.success).toBe(false);
      expect(result.error).toBe('WebSocket connection lost');
    });

    it('should handle Service Bus failure scenario', () => {
      const result = MessagingResult.failure(
        MessagingChannel.ServiceBus,
        'Service Bus unavailable'
      );

      expect(result.sentVia).toBe(MessagingChannel.ServiceBus);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Service Bus unavailable');
    });
  });
});
