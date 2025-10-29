/**
 * @fileoverview Tests for ChatNotificationService
 * @description Tests for chat notification domain service
 */

import { ChatNotificationService } from '../../../../shared/domain/services/ChatNotificationService';
import { ContactManagerFormRequest } from '../../../../shared/domain/value-objects/ContactManagerFormRequest';
import { FormType } from '../../../../shared/domain/enums/FormType';
import { IChatService } from '../../../../shared/domain/interfaces/IChatService';

describe('ChatNotificationService', () => {
  let chatNotificationService: ChatNotificationService;
  let mockChatService: jest.Mocked<IChatService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockChatService = {
      getOrSyncChat: jest.fn(),
      sendMessage: jest.fn(),
    } as any;

    chatNotificationService = new ChatNotificationService(mockChatService);
  });

  describe('constructor', () => {
    it('should create ChatNotificationService instance', () => {
      expect(chatNotificationService).toBeInstanceOf(ChatNotificationService);
    });
  });

  describe('sendNotification', () => {
    const mockToken = 'mock-token';
    const mockChatId = 'chat-123';
    const mockSenderName = 'John Doe';

    it('should send notification successfully with DISCONNECTIONS form type', async () => {
      mockChatService.getOrSyncChat.mockResolvedValue(mockChatId);
      mockChatService.sendMessage.mockResolvedValue(undefined);

      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, {
        numberOfDisconnections: 5,
      });

      await chatNotificationService.sendNotification(mockToken, request, mockSenderName);

      expect(mockChatService.getOrSyncChat).toHaveBeenCalledWith(mockToken);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        mockToken,
        mockChatId,
        expect.objectContaining({
          subject: '🚨 Disconnections Report',
          senderName: mockSenderName,
          formType: FormType.DISCONNECTIONS,
          data: expect.any(Object),
        })
      );
    });

    it('should send notification successfully with ADMISSIONS form type', async () => {
      mockChatService.getOrSyncChat.mockResolvedValue(mockChatId);
      mockChatService.sendMessage.mockResolvedValue(undefined);

      const request = new ContactManagerFormRequest(FormType.ADMISSIONS, {
        numberOfAdmissions: 3,
      });

      await chatNotificationService.sendNotification(mockToken, request, mockSenderName);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        mockToken,
        mockChatId,
        expect.objectContaining({
          subject: '🏥 Admissions Report',
          formType: FormType.ADMISSIONS,
        })
      );
    });

    it('should send notification successfully with ASSISTANCE form type', async () => {
      mockChatService.getOrSyncChat.mockResolvedValue(mockChatId);
      mockChatService.sendMessage.mockResolvedValue(undefined);

      const request = new ContactManagerFormRequest(FormType.ASSISTANCE, {
        numberOfAssists: 2,
      });

      await chatNotificationService.sendNotification(mockToken, request, mockSenderName);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        mockToken,
        mockChatId,
        expect.objectContaining({
          subject: '⚕️ Acute Assessment Report',
          formType: FormType.ASSISTANCE,
        })
      );
    });

    it('should send notification successfully with image URL', async () => {
      const mockImageUrl = 'https://example.com/image.jpg';
      mockChatService.getOrSyncChat.mockResolvedValue(mockChatId);
      mockChatService.sendMessage.mockResolvedValue(undefined);

      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, {
        numberOfDisconnections: 5,
      });

      await chatNotificationService.sendNotification(mockToken, request, mockSenderName, mockImageUrl);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        mockToken,
        mockChatId,
        expect.objectContaining({
          imageUrl: mockImageUrl,
        })
      );
    });

    it('should throw error when getOrSyncChat fails', async () => {
      const mockError = new Error('Chat service error');
      mockChatService.getOrSyncChat.mockRejectedValue(mockError);

      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, {
        numberOfDisconnections: 5,
      });

      await expect(
        chatNotificationService.sendNotification(mockToken, request, mockSenderName)
      ).rejects.toThrow('Failed to send chat notification: Chat service error');
    });

    it('should throw error when sendMessage fails', async () => {
      const mockError = new Error('Send message error');
      mockChatService.getOrSyncChat.mockResolvedValue(mockChatId);
      mockChatService.sendMessage.mockRejectedValue(mockError);

      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, {
        numberOfDisconnections: 5,
      });

      await expect(
        chatNotificationService.sendNotification(mockToken, request, mockSenderName)
      ).rejects.toThrow('Failed to send chat notification: Send message error');
    });

    it('should handle different sender names', async () => {
      mockChatService.getOrSyncChat.mockResolvedValue(mockChatId);
      mockChatService.sendMessage.mockResolvedValue(undefined);

      const differentSenders = ['Alice Smith', 'Bob Johnson', 'Charlie Brown'];
      
      for (const sender of differentSenders) {
        const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, {
          numberOfDisconnections: 5,
        });

        await chatNotificationService.sendNotification(mockToken, request, sender);

        expect(mockChatService.sendMessage).toHaveBeenCalledWith(
          mockToken,
          mockChatId,
          expect.objectContaining({
            senderName: sender,
          })
        );
      }
    });
  });
});

