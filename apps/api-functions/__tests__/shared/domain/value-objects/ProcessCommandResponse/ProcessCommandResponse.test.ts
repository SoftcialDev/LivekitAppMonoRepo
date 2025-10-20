/**
 * @fileoverview ProcessCommandResponse value object - unit tests
 * @summary Tests for ProcessCommandResponse value object functionality
 * @description Validates process command response creation and payload conversion
 */

import { ProcessCommandResponse } from '../../../../../shared/domain/value-objects/ProcessCommandResponse';

describe('ProcessCommandResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command processed successfully'
      );

      expect(response.commandId).toBe('command-123');
      expect(response.delivered).toBe(true);
      expect(response.message).toBe('Command processed successfully');
    });

    it('should create response with delivered false', () => {
      const response = new ProcessCommandResponse(
        'command-456',
        false,
        'Command queued for delivery'
      );

      expect(response.commandId).toBe('command-456');
      expect(response.delivered).toBe(false);
      expect(response.message).toBe('Command queued for delivery');
    });

    it('should create response with different command IDs', () => {
      const response1 = new ProcessCommandResponse('command-1', true, 'Command 1 processed');
      const response2 = new ProcessCommandResponse('command-2', false, 'Command 2 queued');
      const response3 = new ProcessCommandResponse('command-abc-123', true, 'Command abc processed');

      expect(response1.commandId).toBe('command-1');
      expect(response2.commandId).toBe('command-2');
      expect(response3.commandId).toBe('command-abc-123');
    });

    it('should create response with different delivery statuses', () => {
      const deliveredResponse = new ProcessCommandResponse('command-1', true, 'Command delivered');
      const queuedResponse = new ProcessCommandResponse('command-2', false, 'Command queued');

      expect(deliveredResponse.delivered).toBe(true);
      expect(queuedResponse.delivered).toBe(false);
    });

    it('should create response with different messages', () => {
      const response1 = new ProcessCommandResponse('command-1', true, 'Command processed successfully');
      const response2 = new ProcessCommandResponse('command-2', false, 'Command queued for delivery');
      const response3 = new ProcessCommandResponse('command-3', true, 'Command sent to user');

      expect(response1.message).toBe('Command processed successfully');
      expect(response2.message).toBe('Command queued for delivery');
      expect(response3.message).toBe('Command sent to user');
    });

    it('should create response with empty message', () => {
      const response = new ProcessCommandResponse('command-123', true, '');

      expect(response.commandId).toBe('command-123');
      expect(response.delivered).toBe(true);
      expect(response.message).toBe('');
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that contains detailed information about the command processing and provides comprehensive context for debugging purposes';
      const response = new ProcessCommandResponse('command-123', true, longMessage);

      expect(response.commandId).toBe('command-123');
      expect(response.delivered).toBe(true);
      expect(response.message).toBe(longMessage);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command processed successfully'
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        commandId: 'command-123',
        delivered: true,
        message: 'Command processed successfully'
      });
    });

    it('should convert response with delivered false to payload', () => {
      const response = new ProcessCommandResponse(
        'command-456',
        false,
        'Command queued for delivery'
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        commandId: 'command-456',
        delivered: false,
        message: 'Command queued for delivery'
      });
    });

    it('should convert response with empty message to payload', () => {
      const response = new ProcessCommandResponse('command-123', true, '');

      const payload = response.toPayload();

      expect(payload).toEqual({
        commandId: 'command-123',
        delivered: true,
        message: ''
      });
    });

    it('should convert response with long message to payload', () => {
      const longMessage = 'This is a very long message that contains detailed information about the command processing and provides comprehensive context for debugging purposes';
      const response = new ProcessCommandResponse('command-123', true, longMessage);

      const payload = response.toPayload();

      expect(payload.commandId).toBe('command-123');
      expect(payload.delivered).toBe(true);
      expect(payload.message).toBe(longMessage);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command processed successfully'
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).commandId = 'modified-command';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).delivered = false;
      }).not.toThrow();

      expect(() => {
        (response as any).message = 'Modified message';
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in command ID', () => {
      const specialId = 'command-123_abc.def-ghi';
      const response = new ProcessCommandResponse(specialId, true, 'Command processed');

      expect(response.commandId).toBe(specialId);
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = new ProcessCommandResponse('command-123', true, specialMessage);

      expect(response.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Mensaje con caracteres especiales: ñáéíóú';
      const response = new ProcessCommandResponse('command-123', true, unicodeMessage);

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle newlines in message', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = new ProcessCommandResponse('command-123', true, multilineMessage);

      expect(response.message).toBe(multilineMessage);
    });

    it('should handle very long command ID', () => {
      const longId = 'a'.repeat(1000);
      const response = new ProcessCommandResponse(longId, true, 'Command processed');

      expect(response.commandId).toBe(longId);
    });

    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new ProcessCommandResponse('command-123', true, longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should handle numeric command ID', () => {
      const numericId = '123456789';
      const response = new ProcessCommandResponse(numericId, true, 'Command processed');

      expect(response.commandId).toBe(numericId);
    });

    it('should handle alphanumeric command ID', () => {
      const alphanumericId = 'command123abc456def';
      const response = new ProcessCommandResponse(alphanumericId, true, 'Command processed');

      expect(response.commandId).toBe(alphanumericId);
    });

    it('should handle UUID command ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new ProcessCommandResponse(uuid, true, 'Command processed');

      expect(response.commandId).toBe(uuid);
    });
  });

  describe('type safety', () => {
    it('should accept string for command ID', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command processed successfully'
      );

      expect(typeof response.commandId).toBe('string');
    });

    it('should accept boolean for delivered', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command processed successfully'
      );

      expect(typeof response.delivered).toBe('boolean');
    });

    it('should accept string for message', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command processed successfully'
      );

      expect(typeof response.message).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle immediate delivery scenario', () => {
      const response = new ProcessCommandResponse(
        'command-123',
        true,
        'Command delivered immediately to user'
      );

      expect(response.delivered).toBe(true);
      expect(response.message).toBe('Command delivered immediately to user');
    });

    it('should handle queued delivery scenario', () => {
      const response = new ProcessCommandResponse(
        'command-456',
        false,
        'Command queued for delivery when user comes online'
      );

      expect(response.delivered).toBe(false);
      expect(response.message).toBe('Command queued for delivery when user comes online');
    });

    it('should handle camera start command scenario', () => {
      const response = new ProcessCommandResponse(
        'camera-start-123',
        true,
        'Camera start command sent successfully'
      );

      expect(response.commandId).toBe('camera-start-123');
      expect(response.delivered).toBe(true);
      expect(response.message).toBe('Camera start command sent successfully');
    });

    it('should handle camera stop command scenario', () => {
      const response = new ProcessCommandResponse(
        'camera-stop-456',
        true,
        'Camera stop command sent successfully'
      );

      expect(response.commandId).toBe('camera-stop-456');
      expect(response.delivered).toBe(true);
      expect(response.message).toBe('Camera stop command sent successfully');
    });

    it('should handle command with reason scenario', () => {
      const response = new ProcessCommandResponse(
        'command-with-reason-789',
        true,
        'Command sent with reason: Supervisor requested camera start'
      );

      expect(response.commandId).toBe('command-with-reason-789');
      expect(response.delivered).toBe(true);
      expect(response.message).toBe('Command sent with reason: Supervisor requested camera start');
    });

    it('should handle batch command scenario', () => {
      const response = new ProcessCommandResponse(
        'batch-command-123',
        false,
        'Command queued as part of batch processing'
      );

      expect(response.commandId).toBe('batch-command-123');
      expect(response.delivered).toBe(false);
      expect(response.message).toBe('Command queued as part of batch processing');
    });
  });
});
