import { ContactManagerFormService } from '../../../../shared/domain/services/ContactManagerFormService';
import { ContactManagerFormRequest } from '../../../../shared/domain/value-objects/ContactManagerFormRequest';
import { IContactManagerFormRepository } from '../../../../shared/domain/interfaces/IContactManagerFormRepository';
import { IBlobStorageService } from '../../../../shared/domain/interfaces/IBlobStorageService';
import { IChatService } from '../../../../shared/domain/interfaces/IChatService';
import { FormType } from '../../../../shared/domain/enums/FormType';

describe('ContactManagerFormService', () => {
  let service: ContactManagerFormService;
  let formRepository: jest.Mocked<IContactManagerFormRepository>;
  let blobStorageService: jest.Mocked<IBlobStorageService>;
  let chatService: jest.Mocked<IChatService>;

  beforeEach(() => {
    jest.clearAllMocks();
    formRepository = { createForm: jest.fn() } as any;
    blobStorageService = { uploadImage: jest.fn() } as any;
    chatService = {
      getOrSyncChat: jest.fn(),
      sendMessage: jest.fn(),
      getContactManagersChatId: jest.fn(),
      sendMessageAsApp: jest.fn()
    } as any;
    const errorLogService = {
      logError: jest.fn(),
      logChatServiceError: jest.fn()
    } as any;
    service = new ContactManagerFormService(formRepository, blobStorageService, chatService, errorLogService);
  });

  describe('processForm', () => {
    it('should process form without image', async () => {
      formRepository.createForm.mockResolvedValue('form-123');
      chatService.getContactManagersChatId.mockResolvedValue('chat-123');
      chatService.sendMessageAsApp.mockResolvedValue(undefined);
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { numberOfDisconnections: 5 });
      const result = await service.processForm(request, 'sender-123', 'Sender Name', 'sender@example.com');
      expect(result.formId).toBe('form-123');
      expect(result.messageSent).toBe(true);
      expect(chatService.getContactManagersChatId).toHaveBeenCalled();
      expect(chatService.sendMessageAsApp).toHaveBeenCalledWith(
        'chat-123',
        expect.objectContaining({
          type: 'contactManagerForm',
          senderName: 'Sender Name',
          senderEmail: 'sender@example.com'
        })
      );
    });

    it('should process form with image', async () => {
      formRepository.createForm.mockResolvedValue('form-123');
      blobStorageService.uploadImage.mockResolvedValue('https://example.com/image.jpg');
      chatService.getContactManagersChatId.mockResolvedValue('chat-123');
      chatService.sendMessageAsApp.mockResolvedValue();
      const request = new ContactManagerFormRequest(FormType.ADMISSIONS, { numberOfAdmissions: 3 }, 'base64imagedata');
      const result = await service.processForm(request, 'sender-123', 'Sender Name', 'sender@example.com');
      expect(result.imageUrl).toBe('https://example.com/image.jpg');
      expect(chatService.sendMessageAsApp).toHaveBeenCalledWith(
        'chat-123',
        expect.objectContaining({ imageUrl: 'https://example.com/image.jpg' })
      );
    });

    it('should handle notification failure gracefully', async () => {
      formRepository.createForm.mockResolvedValue('form-123');
      chatService.getContactManagersChatId.mockRejectedValue(new Error('Chat error'));
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { numberOfDisconnections: 5 });
      const result = await service.processForm(request, 'sender-123', 'Sender Name', 'sender@example.com');
      expect(result.formId).toBe('form-123');
    });

    it('should throw error when form creation fails', async () => {
      formRepository.createForm.mockRejectedValue(new Error('Database error'));
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { numberOfDisconnections: 5 });
      await expect(
        service.processForm(request, 'sender-123', 'Sender Name', 'sender@example.com')
      ).rejects.toThrow('Failed to process contact manager form');
    });
  });
});