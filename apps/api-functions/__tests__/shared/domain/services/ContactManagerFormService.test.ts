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
    chatService = { getOrSyncChat: jest.fn(), sendMessage: jest.fn() } as any;
    service = new ContactManagerFormService(formRepository, blobStorageService, chatService);
  });

  describe('processForm', () => {
    it('should process form without image', async () => {
      formRepository.createForm.mockResolvedValue('form-123');
      chatService.getOrSyncChat.mockResolvedValue('chat-123');
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { numberOfDisconnections: 5 });
      const result = await service.processForm(request, 'sender-123', 'token', 'Sender Name');
      expect(result.formId).toBe('form-123');
      expect(result.messageSent).toBe(true);
    });

    it('should process form with image', async () => {
      formRepository.createForm.mockResolvedValue('form-123');
      blobStorageService.uploadImage.mockResolvedValue('https://example.com/image.jpg');
      chatService.getOrSyncChat.mockResolvedValue('chat-123');
      const request = new ContactManagerFormRequest(FormType.ADMISSIONS, { numberOfAdmissions: 3 }, 'base64imagedata');
      const result = await service.processForm(request, 'sender-123', 'token', 'Sender Name');
      expect(result.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('should handle notification failure gracefully', async () => {
      formRepository.createForm.mockResolvedValue('form-123');
      chatService.getOrSyncChat.mockRejectedValue(new Error('Chat error'));
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { numberOfDisconnections: 5 });
      const result = await service.processForm(request, 'sender-123', 'token', 'Sender Name');
      expect(result.formId).toBe('form-123');
    });

    it('should throw error when form creation fails', async () => {
      formRepository.createForm.mockRejectedValue(new Error('Database error'));
      const request = new ContactManagerFormRequest(FormType.DISCONNECTIONS, { numberOfDisconnections: 5 });
      await expect(service.processForm(request, 'sender-123', 'token', 'Sender Name')).rejects.toThrow('Failed to process contact manager form');
    });
  });
});