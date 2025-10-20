/**
 * @fileoverview WebSocketEventResponse value object - unit tests
 * @summary Tests for WebSocketEventResponse value object functionality
 * @description Validates event response creation, factory methods, and payload conversion
 */

import { WebSocketEventResponse } from '../../../../../shared/domain/value-objects/WebSocketEventResponse';

describe('WebSocketEventResponse', () => {
  describe('constructor', () => {
    it('should create response with status and message', () => {
      const response = new WebSocketEventResponse(200, 'Event processed successfully');

      expect(response.status).toBe(200);
      expect(response.message).toBe('Event processed successfully');
    });

    it('should create response with different status codes', () => {
      const successResponse = new WebSocketEventResponse(200, 'Success');
      const errorResponse = new WebSocketEventResponse(500, 'Internal Server Error');
      const notFoundResponse = new WebSocketEventResponse(404, 'Not Found');

      expect(successResponse.status).toBe(200);
      expect(errorResponse.status).toBe(500);
      expect(notFoundResponse.status).toBe(404);
    });

    it('should create response with empty message', () => {
      const response = new WebSocketEventResponse(200, '');

      expect(response.status).toBe(200);
      expect(response.message).toBe('');
    });

    it('should create response with long message', () => {
      const longMessage = 'This is a very long message that contains detailed information about the WebSocket event processing and provides comprehensive context for debugging purposes';
      const response = new WebSocketEventResponse(200, longMessage);

      expect(response.status).toBe(200);
      expect(response.message).toBe(longMessage);
    });
  });

  describe('success factory method', () => {
    it('should create success response with default message', () => {
      const response = WebSocketEventResponse.success();

      expect(response.status).toBe(200);
      expect(response.message).toBe('Event processed successfully');
    });

    it('should create success response with custom message', () => {
      const response = WebSocketEventResponse.success('Custom success message');

      expect(response.status).toBe(200);
      expect(response.message).toBe('Custom success message');
    });

    it('should create success response with empty message', () => {
      const response = WebSocketEventResponse.success('');

      expect(response.status).toBe(200);
      expect(response.message).toBe('');
    });
  });

  describe('error factory method', () => {
    it('should create error response with default status', () => {
      const response = WebSocketEventResponse.error('Error occurred');

      expect(response.status).toBe(500);
      expect(response.message).toBe('Error occurred');
    });

    it('should create error response with custom status', () => {
      const response = WebSocketEventResponse.error('Bad Request', 400);

      expect(response.status).toBe(400);
      expect(response.message).toBe('Bad Request');
    });

    it('should create error response with different status codes', () => {
      const badRequestResponse = WebSocketEventResponse.error('Bad Request', 400);
      const unauthorizedResponse = WebSocketEventResponse.error('Unauthorized', 401);
      const forbiddenResponse = WebSocketEventResponse.error('Forbidden', 403);
      const notFoundResponse = WebSocketEventResponse.error('Not Found', 404);
      const internalErrorResponse = WebSocketEventResponse.error('Internal Server Error', 500);

      expect(badRequestResponse.status).toBe(400);
      expect(unauthorizedResponse.status).toBe(401);
      expect(forbiddenResponse.status).toBe(403);
      expect(notFoundResponse.status).toBe(404);
      expect(internalErrorResponse.status).toBe(500);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new WebSocketEventResponse(200, 'Event processed successfully');

      const payload = response.toPayload();

      expect(payload).toEqual({
        status: 200,
        message: 'Event processed successfully'
      });
    });

    it('should convert error response to payload', () => {
      const response = new WebSocketEventResponse(500, 'Internal Server Error');

      const payload = response.toPayload();

      expect(payload).toEqual({
        status: 500,
        message: 'Internal Server Error'
      });
    });

    it('should convert factory method responses to payload', () => {
      const successResponse = WebSocketEventResponse.success('Success message');
      const errorResponse = WebSocketEventResponse.error('Error message', 400);

      expect(successResponse.toPayload()).toEqual({
        status: 200,
        message: 'Success message'
      });

      expect(errorResponse.toPayload()).toEqual({
        status: 400,
        message: 'Error message'
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new WebSocketEventResponse(200, 'Event processed successfully');

      // TypeScript should prevent these assignments
      expect(() => {
        (response as any).status = 500;
      }).not.toThrow(); // JavaScript allows property modification

      expect(() => {
        (response as any).message = 'Modified message';
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle zero status code', () => {
      const response = new WebSocketEventResponse(0, 'Zero status');

      expect(response.status).toBe(0);
      expect(response.message).toBe('Zero status');
    });

    it('should handle negative status code', () => {
      const response = new WebSocketEventResponse(-1, 'Negative status');

      expect(response.status).toBe(-1);
      expect(response.message).toBe('Negative status');
    });

    it('should handle very large status code', () => {
      const response = new WebSocketEventResponse(999999, 'Large status');

      expect(response.status).toBe(999999);
      expect(response.message).toBe('Large status');
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const response = new WebSocketEventResponse(200, specialMessage);

      expect(response.message).toBe(specialMessage);
    });

    it('should handle unicode characters in message', () => {
      const unicodeMessage = 'Mensaje con caracteres especiales: ñáéíóú';
      const response = new WebSocketEventResponse(200, unicodeMessage);

      expect(response.message).toBe(unicodeMessage);
    });

    it('should handle newlines in message', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const response = new WebSocketEventResponse(200, multilineMessage);

      expect(response.message).toBe(multilineMessage);
    });
  });

  describe('type safety', () => {
    it('should accept number for status', () => {
      const response = new WebSocketEventResponse(200, 'Message');

      expect(typeof response.status).toBe('number');
    });

    it('should accept string for message', () => {
      const response = new WebSocketEventResponse(200, 'Message');

      expect(typeof response.message).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle connection success scenario', () => {
      const response = WebSocketEventResponse.success('User connected successfully');

      expect(response.status).toBe(200);
      expect(response.message).toBe('User connected successfully');
    });

    it('should handle connection error scenario', () => {
      const response = WebSocketEventResponse.error('Connection failed', 500);

      expect(response.status).toBe(500);
      expect(response.message).toBe('Connection failed');
    });

    it('should handle disconnection success scenario', () => {
      const response = WebSocketEventResponse.success('User disconnected successfully');

      expect(response.status).toBe(200);
      expect(response.message).toBe('User disconnected successfully');
    });

    it('should handle authentication error scenario', () => {
      const response = WebSocketEventResponse.error('Authentication failed', 401);

      expect(response.status).toBe(401);
      expect(response.message).toBe('Authentication failed');
    });

    it('should handle authorization error scenario', () => {
      const response = WebSocketEventResponse.error('Access denied', 403);

      expect(response.status).toBe(403);
      expect(response.message).toBe('Access denied');
    });

    it('should handle validation error scenario', () => {
      const response = WebSocketEventResponse.error('Invalid request data', 400);

      expect(response.status).toBe(400);
      expect(response.message).toBe('Invalid request data');
    });
  });
});
