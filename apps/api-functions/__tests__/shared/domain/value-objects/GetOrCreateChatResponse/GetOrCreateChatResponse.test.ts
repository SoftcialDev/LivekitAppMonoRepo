import { GetOrCreateChatResponse } from '../../../../../shared/domain/value-objects/GetOrCreateChatResponse';

describe('GetOrCreateChatResponse', () => {
  describe('constructor', () => {
    it('should create response with valid chat ID', () => {
      const response = new GetOrCreateChatResponse('chat-123');

      expect(response.chatId).toBe('chat-123');
    });

    it('should handle different chat ID formats', () => {
      const response1 = new GetOrCreateChatResponse('chat-abc');
      const response2 = new GetOrCreateChatResponse('chat-xyz');

      expect(response1.chatId).toBe('chat-abc');
      expect(response2.chatId).toBe('chat-xyz');
    });

    it('should handle UUID format chat ID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new GetOrCreateChatResponse(uuid);

      expect(response.chatId).toBe(uuid);
    });

    it('should handle numeric chat ID', () => {
      const numericId = '123456789';
      const response = new GetOrCreateChatResponse(numericId);

      expect(response.chatId).toBe(numericId);
    });

    it('should handle alphanumeric chat ID', () => {
      const alphanumericId = 'chat123abc456def';
      const response = new GetOrCreateChatResponse(alphanumericId);

      expect(response.chatId).toBe(alphanumericId);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const response = new GetOrCreateChatResponse('chat-123');
      const payload = response.toPayload();

      expect(payload).toEqual({
        chatId: 'chat-123'
      });
    });

    it('should convert different chat IDs to payload', () => {
      const response1 = new GetOrCreateChatResponse('chat-abc');
      const response2 = new GetOrCreateChatResponse('chat-xyz');

      const payload1 = response1.toPayload();
      const payload2 = response2.toPayload();

      expect(payload1).toEqual({
        chatId: 'chat-abc'
      });
      expect(payload2).toEqual({
        chatId: 'chat-xyz'
      });
    });

    it('should convert UUID chat ID to payload', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const response = new GetOrCreateChatResponse(uuid);
      const payload = response.toPayload();

      expect(payload).toEqual({
        chatId: uuid
      });
    });

    it('should convert numeric chat ID to payload', () => {
      const numericId = '123456789';
      const response = new GetOrCreateChatResponse(numericId);
      const payload = response.toPayload();

      expect(payload).toEqual({
        chatId: numericId
      });
    });

    it('should convert alphanumeric chat ID to payload', () => {
      const alphanumericId = 'chat123abc456def';
      const response = new GetOrCreateChatResponse(alphanumericId);
      const payload = response.toPayload();

      expect(payload).toEqual({
        chatId: alphanumericId
      });
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const response = new GetOrCreateChatResponse('chat-123');

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).chatId = 'modified-chat';
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty chat ID string', () => {
      const response = new GetOrCreateChatResponse('');

      expect(response.chatId).toBe('');
    });

    it('should handle long chat ID string', () => {
      const longId = 'chat-' + 'a'.repeat(1000);
      const response = new GetOrCreateChatResponse(longId);

      expect(response.chatId).toBe(longId);
    });

    it('should handle special characters in chat ID', () => {
      const specialId = 'chat-123!@#$%^&*()';
      const response = new GetOrCreateChatResponse(specialId);

      expect(response.chatId).toBe(specialId);
    });

    it('should handle unicode characters in chat ID', () => {
      const unicodeId = 'chat-123-émojis-🚀';
      const response = new GetOrCreateChatResponse(unicodeId);

      expect(response.chatId).toBe(unicodeId);
    });

    it('should handle chat ID with spaces', () => {
      const spacedId = 'chat 123 abc';
      const response = new GetOrCreateChatResponse(spacedId);

      expect(response.chatId).toBe(spacedId);
    });

    it('should handle chat ID with hyphens', () => {
      const hyphenatedId = 'chat-123-abc-def';
      const response = new GetOrCreateChatResponse(hyphenatedId);

      expect(response.chatId).toBe(hyphenatedId);
    });

    it('should handle chat ID with underscores', () => {
      const underscoredId = 'chat_123_abc_def';
      const response = new GetOrCreateChatResponse(underscoredId);

      expect(response.chatId).toBe(underscoredId);
    });

    it('should handle chat ID with dots', () => {
      const dottedId = 'chat.123.abc.def';
      const response = new GetOrCreateChatResponse(dottedId);

      expect(response.chatId).toBe(dottedId);
    });
  });

  describe('type safety', () => {
    it('should accept string for chatId', () => {
      const response = new GetOrCreateChatResponse('chat-123');
      expect(typeof response.chatId).toBe('string');
    });

    it('should return object from toPayload', () => {
      const response = new GetOrCreateChatResponse('chat-123');
      const payload = response.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('chatId');
      expect(typeof payload.chatId).toBe('string');
    });
  });

  describe('validation scenarios', () => {
    it('should handle new chat creation scenario', () => {
      const response = new GetOrCreateChatResponse('new-chat-123');

      expect(response.chatId).toBe('new-chat-123');
    });

    it('should handle existing chat retrieval scenario', () => {
      const response = new GetOrCreateChatResponse('existing-chat-456');

      expect(response.chatId).toBe('existing-chat-456');
    });

    it('should handle supervisor-PSO chat scenario', () => {
      const response = new GetOrCreateChatResponse('supervisor-pso-chat-789');

      expect(response.chatId).toBe('supervisor-pso-chat-789');
    });

    it('should handle admin-PSO chat scenario', () => {
      const response = new GetOrCreateChatResponse('admin-pso-chat-101');

      expect(response.chatId).toBe('admin-pso-chat-101');
    });

    it('should handle contact manager-PSO chat scenario', () => {
      const response = new GetOrCreateChatResponse('contact-manager-pso-chat-202');

      expect(response.chatId).toBe('contact-manager-pso-chat-202');
    });

    it('should handle PSO-PSO chat scenario', () => {
      const response = new GetOrCreateChatResponse('pso-pso-chat-303');

      expect(response.chatId).toBe('pso-pso-chat-303');
    });

    it('should handle group chat scenario', () => {
      const response = new GetOrCreateChatResponse('group-chat-404');

      expect(response.chatId).toBe('group-chat-404');
    });

    it('should handle private chat scenario', () => {
      const response = new GetOrCreateChatResponse('private-chat-505');

      expect(response.chatId).toBe('private-chat-505');
    });

    it('should handle chat with timestamp scenario', () => {
      const timestamp = new Date().getTime();
      const response = new GetOrCreateChatResponse(`chat-${timestamp}`);

      expect(response.chatId).toBe(`chat-${timestamp}`);
    });

    it('should handle chat with user context scenario', () => {
      const response = new GetOrCreateChatResponse('user-context-chat-606');

      expect(response.chatId).toBe('user-context-chat-606');
    });
  });
});
