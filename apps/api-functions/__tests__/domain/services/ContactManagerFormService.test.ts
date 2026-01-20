import { ContactManagerFormService } from '../../../src/domain/services/ContactManagerFormService';
import { IContactManagerFormRepository } from '../../../src/domain/interfaces/IContactManagerFormRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { ContactManagerFormRequest } from '../../../src/domain/value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../../../src/domain/value-objects/ContactManagerFormResult';
import { ContactManagerFormProcessingError } from '../../../src/domain/errors/ContactManagerErrors';
import { createMockContactManagerFormRepository, createMockBlobStorageService } from './domainServiceTestSetup';
import { FormType } from '../../../src/domain/enums/FormType';

describe('ContactManagerFormService', () => {
  let service: ContactManagerFormService;
  let mockFormRepository: jest.Mocked<IContactManagerFormRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;

  beforeEach(() => {
    mockFormRepository = createMockContactManagerFormRepository();
    mockBlobStorageService = createMockBlobStorageService();
    service = new ContactManagerFormService(mockFormRepository, mockBlobStorageService);
  });

  describe('processForm', () => {
    it('should process form with image successfully', async () => {
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { field1: 'value1' },
        'base64image'
      );
      const senderId = 'sender-id';
      const senderName = 'Sender Name';
      const senderEmail = 'sender@example.com';
      const imageUrl = 'https://storage.example.com/image.jpg';

      mockBlobStorageService.uploadImage.mockResolvedValue(imageUrl);
      mockFormRepository.createForm.mockResolvedValue('form-id');

      const result = await service.processForm(request, senderId, senderName, senderEmail);

      expect(mockBlobStorageService.uploadImage).toHaveBeenCalled();
      expect(mockFormRepository.createForm).toHaveBeenCalled();
      expect(result.formId).toBe('form-id');
      expect(result.messageSent).toBe(true);
      expect(result.imageUrl).toBe(imageUrl);
    });

    it('should process form without image successfully', async () => {
      const request = new ContactManagerFormRequest(
        FormType.ADMISSIONS,
        { field1: 'value1' }
      );
      const senderId = 'sender-id';
      const senderName = 'Sender Name';
      const senderEmail = 'sender@example.com';

      mockFormRepository.createForm.mockResolvedValue('form-id');

      const result = await service.processForm(request, senderId, senderName, senderEmail);

      expect(mockBlobStorageService.uploadImage).not.toHaveBeenCalled();
      expect(mockFormRepository.createForm).toHaveBeenCalledWith(
        expect.objectContaining({
          formType: FormType.ADMISSIONS,
          senderId,
        })
      );
      expect(result.imageUrl).toBeUndefined();
    });

    it('should throw error when image upload fails', async () => {
      const request = new ContactManagerFormRequest(
        FormType.ASSISTANCE,
        { field1: 'value1' },
        'base64image'
      );
      const senderId = 'sender-id';
      const senderName = 'Sender Name';
      const senderEmail = 'sender@example.com';

      mockBlobStorageService.uploadImage.mockRejectedValue(new Error('Upload failed'));

      await expect(service.processForm(request, senderId, senderName, senderEmail)).rejects.toThrow(
        ContactManagerFormProcessingError
      );
    });

    it('should throw error when form creation fails', async () => {
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { field1: 'value1' }
      );
      const senderId = 'sender-id';
      const senderName = 'Sender Name';
      const senderEmail = 'sender@example.com';

      mockFormRepository.createForm.mockRejectedValue(new Error('Database error'));

      await expect(service.processForm(request, senderId, senderName, senderEmail)).rejects.toThrow(
        ContactManagerFormProcessingError
      );
    });
  });
});






