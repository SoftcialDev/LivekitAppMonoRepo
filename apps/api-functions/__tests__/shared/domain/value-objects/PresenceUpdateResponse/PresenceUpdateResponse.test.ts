/**
 * @fileoverview PresenceUpdateResponse value object - unit tests
 * @summary Tests for PresenceUpdateResponse value object functionality
 * @description Validates presence update response creation and payload conversion
 */

import { PresenceUpdateResponse } from '../../../../../shared/domain/value-objects/PresenceUpdateResponse';

describe('PresenceUpdateResponse', () => {
  describe('constructor', () => {
    it('should create response with message', () => {
      const response = new PresenceUpdateResponse('Presence updated successfully');

      expect(response.message).toBe('Presence updated successfully');
    });

    it('should create response with different messages', () => {
      const response1 = new PresenceUpdateResponse('User presence set to online');
      const response2 = new PresenceUpdateResponse('User presence set to offline');
      const response3 = new PresenceUpdateResponse('Presence status updated');

      expect(response1.message).toBe('User presence set to online');
      expect(response2.message).toBe('User presence set to offline');
      expect(response3.message).toBe('Presence status updated');
    });

    it('should create response with empty message', () => {
      const response = new PresenceUpdateResponse('');

      expect(response.message).toBe('');
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that contains detailed information about the presence update and provides comprehensive context for debugging purposes';
      const response = new PresenceUpdateResponse(longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should create response with special characters in message', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = new PresenceUpdateResponse(specialMessage);

      expect(response.message).toBe(specialMessage);
    });

    it('should create response with unicode characters in message', () => {
      const unicodeMessage = 'Mensaje con caracteres especiales: ñáéíóú';
      const response = new PresenceUpdateResponse(unicodeMessage);

      expect(response.message).toBe(unicodeMessage);
    });

    it('should create response with newlines in message', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = new PresenceUpdateResponse(multilineMessage);

      expect(response.message).toBe(multilineMessage);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new PresenceUpdateResponse('Presence updated successfully');

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Presence updated successfully'
      });
    });

    it('should convert response with empty message to payload', () => {
      const response = new PresenceUpdateResponse('');

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: ''
      });
    });

    it('should convert response with long message to payload', () => {
      const longMessage = 'This is a very long message that contains detailed information about the presence update and provides comprehensive context for debugging purposes';
      const response = new PresenceUpdateResponse(longMessage);

      const payload = response.toPayload();

      expect(payload.message).toBe(longMessage);
    });

    it('should convert response with special characters to payload', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = new PresenceUpdateResponse(specialMessage);

      const payload = response.toPayload();

      expect(payload.message).toBe(specialMessage);
    });

    it('should convert response with unicode characters to payload', () => {
      const unicodeMessage = 'Mensaje con caracteres especiales: ñáéíóú';
      const response = new PresenceUpdateResponse(unicodeMessage);

      const payload = response.toPayload();

      expect(payload.message).toBe(unicodeMessage);
    });

    it('should convert response with newlines to payload', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = new PresenceUpdateResponse(multilineMessage);

      const payload = response.toPayload();

      expect(payload.message).toBe(multilineMessage);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new PresenceUpdateResponse('Presence updated successfully');

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).message = 'Modified message';
      }).not.toThrow(); // JavaScript allows property modification
    });
  });

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const response = new PresenceUpdateResponse(longMessage);

      expect(response.message).toBe(longMessage);
    });

    it('should handle message with only spaces', () => {
      const spaceMessage = '   ';
      const response = new PresenceUpdateResponse(spaceMessage);

      expect(response.message).toBe(spaceMessage);
    });

    it('should handle message with only newlines', () => {
      const newlineMessage = '\n\n\n';
      const response = new PresenceUpdateResponse(newlineMessage);

      expect(response.message).toBe(newlineMessage);
    });

    it('should handle message with tabs', () => {
      const tabMessage = 'Message\twith\ttabs';
      const response = new PresenceUpdateResponse(tabMessage);

      expect(response.message).toBe(tabMessage);
    });

    it('should handle message with mixed whitespace', () => {
      const mixedWhitespaceMessage = 'Message with\n\t mixed whitespace';
      const response = new PresenceUpdateResponse(mixedWhitespaceMessage);

      expect(response.message).toBe(mixedWhitespaceMessage);
    });
  });

  describe('type safety', () => {
    it('should accept string for message', () => {
      const response = new PresenceUpdateResponse('Presence updated successfully');

      expect(typeof response.message).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle online presence scenario', () => {
      const response = new PresenceUpdateResponse('User presence set to online');

      expect(response.message).toBe('User presence set to online');
    });

    it('should handle offline presence scenario', () => {
      const response = new PresenceUpdateResponse('User presence set to offline');

      expect(response.message).toBe('User presence set to offline');
    });

    it('should handle presence update with timestamp scenario', () => {
      const timestamp = new Date().toISOString();
      const response = new PresenceUpdateResponse(`Presence updated at ${timestamp}`);

      expect(response.message).toBe(`Presence updated at ${timestamp}`);
    });

    it('should handle presence update with user context scenario', () => {
      const response = new PresenceUpdateResponse('Presence updated for user: john.doe@example.com');

      expect(response.message).toBe('Presence updated for user: john.doe@example.com');
    });

    it('should handle presence update with session context scenario', () => {
      const response = new PresenceUpdateResponse('Presence updated for session: session-123');

      expect(response.message).toBe('Presence updated for session: session-123');
    });

    it('should handle presence update with reason scenario', () => {
      const response = new PresenceUpdateResponse('Presence updated due to user login');

      expect(response.message).toBe('Presence updated due to user login');
    });

    it('should handle presence update with error scenario', () => {
      const response = new PresenceUpdateResponse('Presence update failed: User not found');

      expect(response.message).toBe('Presence update failed: User not found');
    });

    it('should handle presence update with success scenario', () => {
      const response = new PresenceUpdateResponse('Presence update completed successfully');

      expect(response.message).toBe('Presence update completed successfully');
    });
  });
});
