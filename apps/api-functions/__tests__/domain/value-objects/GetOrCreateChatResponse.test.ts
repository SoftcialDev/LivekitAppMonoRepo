import { GetOrCreateChatResponse } from '../../../src/domain/value-objects/GetOrCreateChatResponse';

describe('GetOrCreateChatResponse', () => {
  describe('toPayload', () => {
    it('should convert response to payload format', () => {
      const response = new GetOrCreateChatResponse('chat-id-123');
      const payload = response.toPayload();

      expect(payload).toEqual({
        chatId: 'chat-id-123'
      });
    });
  });
});



