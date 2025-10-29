/**
 * @fileoverview Tests for ContactManagerFormApplicationService
 * @description Tests for contact manager form application service
 */

import { ContactManagerFormApplicationService } from '../../../../shared/application/services/ContactManagerFormApplicationService';
import { IContactManagerFormService } from '../../../../shared/domain/interfaces/IContactManagerFormService';
import { IAuthorizationService } from '../../../../shared/domain/interfaces/IAuthorizationService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { ContactManagerFormRequest } from '../../../../shared/domain/value-objects/ContactManagerFormRequest';
import { ContactManagerFormResult } from '../../../../shared/domain/value-objects/ContactManagerFormResult';
import { FormType } from '../../../../shared/domain/enums/FormType';

describe('ContactManagerFormApplicationService', () => {
  let contactManagerFormApplicationService: ContactManagerFormApplicationService;
  let mockContactManagerFormService: jest.Mocked<IContactManagerFormService>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContactManagerFormService = {
      processForm: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeCommandAcknowledgment: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    contactManagerFormApplicationService = new ContactManagerFormApplicationService(
      mockContactManagerFormService,
      mockAuthorizationService,
      mockUserRepository
    );
  });

  describe('constructor', () => {
    it('should create ContactManagerFormApplicationService instance', () => {
      expect(contactManagerFormApplicationService).toBeInstanceOf(ContactManagerFormApplicationService);
    });
  });

  describe('processForm', () => {
    it('should process form successfully when user is authorized', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Test description' },
        'test-image-url'
      );
      const expectedResult = new ContactManagerFormResult('form-123', true);

      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Employee' as any,
      };

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      mockContactManagerFormService.processForm.mockResolvedValue(expectedResult);

      const result = await contactManagerFormApplicationService.processForm(request, callerId, token);

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockContactManagerFormService.processForm).toHaveBeenCalledWith(
        request,
        'user-123',
        token,
        'Test User'
      );
      expect(result).toBe(expectedResult);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Test description' },
        'test-image-url'
      );

      const authError = new Error('User not authorized');
      mockAuthorizationService.authorizeCommandAcknowledgment.mockRejectedValue(authError);

      await expect(contactManagerFormApplicationService.processForm(request, callerId, token))
        .rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).not.toHaveBeenCalled();
      expect(mockContactManagerFormService.processForm).not.toHaveBeenCalled();
    });

    it('should throw error when user is not found', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Test description' },
        'test-image-url'
      );

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(contactManagerFormApplicationService.processForm(request, callerId, token))
        .rejects.toThrow('User not found');

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockContactManagerFormService.processForm).not.toHaveBeenCalled();
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Test description' },
        'test-image-url'
      );

      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Employee' as any,
      };

      const domainError = new Error('Form processing failed');
      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      mockContactManagerFormService.processForm.mockRejectedValue(domainError);

      await expect(contactManagerFormApplicationService.processForm(request, callerId, token))
        .rejects.toThrow('Form processing failed');

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
      expect(mockUserRepository.findByAzureAdObjectId).toHaveBeenCalledWith(callerId);
      expect(mockContactManagerFormService.processForm).toHaveBeenCalledWith(
        request,
        'user-123',
        token,
        'Test User'
      );
    });

    it('should handle different form types', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Employee' as any,
      };

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      mockContactManagerFormService.processForm.mockResolvedValue(new ContactManagerFormResult('form-123', true));

      // Test different form types
      const incidentRequest = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Incident description' },
        'incident-image-url'
      );

      const complaintRequest = new ContactManagerFormRequest(
        FormType.ADMISSIONS,
        { description: 'Complaint description' },
        'complaint-image-url'
      );

      await contactManagerFormApplicationService.processForm(incidentRequest, callerId, token);
      await contactManagerFormApplicationService.processForm(complaintRequest, callerId, token);

      expect(mockContactManagerFormService.processForm).toHaveBeenCalledTimes(2);
      expect(mockContactManagerFormService.processForm).toHaveBeenCalledWith(
        incidentRequest,
        'user-123',
        token,
        'Test User'
      );
      expect(mockContactManagerFormService.processForm).toHaveBeenCalledWith(
        complaintRequest,
        'user-123',
        token,
        'Test User'
      );
    });

    it('should handle form without image', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Test description' },
        undefined
      );

      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Employee' as any,
      };

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      mockContactManagerFormService.processForm.mockResolvedValue(new ContactManagerFormResult('form-123', true));

      const result = await contactManagerFormApplicationService.processForm(request, callerId, token);

      expect(mockContactManagerFormService.processForm).toHaveBeenCalledWith(
        request,
        'user-123',
        token,
        'Test User'
      );
      expect(result.messageSent).toBe(true);
    });
  });

  describe('authorizeFormSubmission', () => {
    it('should call authorization service', async () => {
      const callerId = 'test-caller-id';
      const token = 'test-token';
      const request = new ContactManagerFormRequest(
        FormType.DISCONNECTIONS,
        { description: 'Test description' },
        'test-image-url'
      );

      const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'Employee' as any,
      };

      mockAuthorizationService.authorizeCommandAcknowledgment.mockResolvedValue(undefined);
      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      mockContactManagerFormService.processForm.mockResolvedValue(new ContactManagerFormResult('form-123', true));

      await contactManagerFormApplicationService.processForm(request, callerId, token);

      expect(mockAuthorizationService.authorizeCommandAcknowledgment).toHaveBeenCalledWith(callerId);
    });
  });
});
