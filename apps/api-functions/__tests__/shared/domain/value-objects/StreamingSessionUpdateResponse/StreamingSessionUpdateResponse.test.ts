/**
 * @fileoverview StreamingSessionUpdateResponse value object - unit tests
 * @summary Tests for StreamingSessionUpdateResponse value object functionality
 * @description Validates streaming session update response creation and payload conversion
 */

import { StreamingSessionUpdateResponse } from '../../../../../shared/domain/value-objects/StreamingSessionUpdateResponse';
import { StreamingStatus } from '../../../../../shared/domain/enums/StreamingStatus';

describe('StreamingSessionUpdateResponse', () => {
  describe('constructor', () => {
    it('should create response with all properties', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session updated successfully',
        StreamingStatus.Started
      );

      expect(response.message).toBe('Streaming session updated successfully');
      expect(response.status).toBe(StreamingStatus.Started);
      expect(response.stopReason).toBeUndefined();
    });

    it('should create response with stop reason', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped successfully',
        StreamingStatus.Stopped,
        'COMMAND'
      );

      expect(response.message).toBe('Streaming session stopped successfully');
      expect(response.status).toBe(StreamingStatus.Stopped);
      expect(response.stopReason).toBe('COMMAND');
    });

    it('should create response with different stop reasons', () => {
      const commandResponse = new StreamingSessionUpdateResponse(
        'Session stopped by command',
        StreamingStatus.Stopped,
        'COMMAND'
      );

      const disconnectResponse = new StreamingSessionUpdateResponse(
        'Session stopped by disconnect',
        StreamingStatus.Stopped,
        'DISCONNECT'
      );

      const timeoutResponse = new StreamingSessionUpdateResponse(
        'Session stopped by timeout',
        StreamingStatus.Stopped,
        'TIMEOUT'
      );

      expect(commandResponse.stopReason).toBe('COMMAND');
      expect(disconnectResponse.stopReason).toBe('DISCONNECT');
      expect(timeoutResponse.stopReason).toBe('TIMEOUT');
    });

    it('should create response with different streaming statuses', () => {
      const startedResponse = new StreamingSessionUpdateResponse(
        'Session started',
        StreamingStatus.Started
      );

      const stoppedResponse = new StreamingSessionUpdateResponse(
        'Session stopped',
        StreamingStatus.Stopped,
        'COMMAND'
      );

      expect(startedResponse.status).toBe(StreamingStatus.Started);
      expect(stoppedResponse.status).toBe(StreamingStatus.Stopped);
    });

    it('should create response with empty message', () => {
      const response = new StreamingSessionUpdateResponse(
        '',
        StreamingStatus.Started
      );

      expect(response.message).toBe('');
      expect(response.status).toBe(StreamingStatus.Started);
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that contains detailed information about the streaming session update and provides comprehensive context for debugging purposes';
      const response = new StreamingSessionUpdateResponse(
        longMessage,
        StreamingStatus.Started
      );

      expect(response.message).toBe(longMessage);
      expect(response.status).toBe(StreamingStatus.Started);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format without stop reason', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session updated successfully',
        StreamingStatus.Started
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Streaming session updated successfully',
        status: StreamingStatus.Started,
        stopReason: undefined
      });
    });

    it('should convert to payload format with stop reason', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped successfully',
        StreamingStatus.Stopped,
        'COMMAND'
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: 'Streaming session stopped successfully',
        status: StreamingStatus.Stopped,
        stopReason: 'COMMAND'
      });
    });

    it('should convert response with empty message to payload', () => {
      const response = new StreamingSessionUpdateResponse(
        '',
        StreamingStatus.Started
      );

      const payload = response.toPayload();

      expect(payload).toEqual({
        message: '',
        status: StreamingStatus.Started,
        stopReason: undefined
      });
    });

    it('should convert response with long message to payload', () => {
      const longMessage = 'This is a very long message that contains detailed information about the streaming session update and provides comprehensive context for debugging purposes';
      const response = new StreamingSessionUpdateResponse(
        longMessage,
        StreamingStatus.Started
      );

      const payload = response.toPayload();

      expect(payload.message).toBe(longMessage);
      expect(payload.status).toBe(StreamingStatus.Started);
      expect(payload.stopReason).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session updated successfully',
        StreamingStatus.Started
      );

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).message = 'Modified message';
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).status = StreamingStatus.Stopped;
      }).not.toThrow();

      expect(() => {
        (response as any).stopReason = 'MODIFIED';
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in message', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = new StreamingSessionUpdateResponse(
        specialMessage,
        StreamingStatus.Started
      );

      expect(response.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Mensaje con caracteres especiales: ñáéíóú';
      const response = new StreamingSessionUpdateResponse(
        unicodeMessage,
        StreamingStatus.Started
      );

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle newlines in message', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = new StreamingSessionUpdateResponse(
        multilineMessage,
        StreamingStatus.Started
      );

      expect(response.message).toBe(multilineMessage);
    });

    it('should handle special characters in stop reason', () => {
      const response = new StreamingSessionUpdateResponse(
        'Session stopped',
        StreamingStatus.Stopped,
        'COMMAND_WITH_SPECIAL_CHARS'
      );

      expect(response.stopReason).toBe('COMMAND_WITH_SPECIAL_CHARS');
    });

    it('should handle empty stop reason', () => {
      const response = new StreamingSessionUpdateResponse(
        'Session stopped',
        StreamingStatus.Stopped,
        ''
      );

      expect(response.stopReason).toBe('');
    });

    it('should handle long stop reason', () => {
      const longStopReason = 'VERY_LONG_STOP_REASON_THAT_CONTAINS_DETAILED_INFORMATION_ABOUT_WHY_THE_SESSION_WAS_STOPPED';
      const response = new StreamingSessionUpdateResponse(
        'Session stopped',
        StreamingStatus.Stopped,
        longStopReason
      );

      expect(response.stopReason).toBe(longStopReason);
    });
  });

  describe('type safety', () => {
    it('should accept string for message', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session updated successfully',
        StreamingStatus.Started
      );

      expect(typeof response.message).toBe('string');
    });

    it('should accept StreamingStatus enum for status', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session updated successfully',
        StreamingStatus.Started
      );

      expect(response.status).toBe(StreamingStatus.Started);
    });

    it('should accept optional string for stop reason', () => {
      const responseWithReason = new StreamingSessionUpdateResponse(
        'Session stopped',
        StreamingStatus.Stopped,
        'COMMAND'
      );

      const responseWithoutReason = new StreamingSessionUpdateResponse(
        'Session started',
        StreamingStatus.Started
      );

      expect(typeof responseWithReason.stopReason).toBe('string');
      expect(responseWithoutReason.stopReason).toBeUndefined();
    });
  });

  describe('validation scenarios', () => {
    it('should handle session start scenario', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session started successfully',
        StreamingStatus.Started
      );

      expect(response.status).toBe(StreamingStatus.Started);
      expect(response.stopReason).toBeUndefined();
    });

    it('should handle session stop by command scenario', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped by command',
        StreamingStatus.Stopped,
        'COMMAND'
      );

      expect(response.status).toBe(StreamingStatus.Stopped);
      expect(response.stopReason).toBe('COMMAND');
    });

    it('should handle session stop by disconnect scenario', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped by disconnect',
        StreamingStatus.Stopped,
        'DISCONNECT'
      );

      expect(response.status).toBe(StreamingStatus.Stopped);
      expect(response.stopReason).toBe('DISCONNECT');
    });

    it('should handle session stop by timeout scenario', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped by timeout',
        StreamingStatus.Stopped,
        'TIMEOUT'
      );

      expect(response.status).toBe(StreamingStatus.Stopped);
      expect(response.stopReason).toBe('TIMEOUT');
    });

    it('should handle session stop by user scenario', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped by user',
        StreamingStatus.Stopped,
        'USER'
      );

      expect(response.status).toBe(StreamingStatus.Stopped);
      expect(response.stopReason).toBe('USER');
    });

    it('should handle session stop by system scenario', () => {
      const response = new StreamingSessionUpdateResponse(
        'Streaming session stopped by system',
        StreamingStatus.Stopped,
        'SYSTEM'
      );

      expect(response.status).toBe(StreamingStatus.Stopped);
      expect(response.stopReason).toBe('SYSTEM');
    });
  });
});
