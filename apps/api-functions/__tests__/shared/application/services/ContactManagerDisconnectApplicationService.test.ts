/**
 * @fileoverview Tests for ContactManagerDisconnectApplicationService
 * @description Tests for contact manager disconnect application service
 */

import { ContactManagerDisconnectApplicationService } from '../../../../shared/application/services/ContactManagerDisconnectApplicationService';
import { ContactManagerDisconnectDomainService } from '../../../../shared/domain/services/ContactManagerDisconnectDomainService';
import { PresenceDomainService } from '../../../../shared/domain/services/PresenceDomainService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { WebSocketEventRequest } from '../../../../shared/domain/value-objects/WebSocketEventRequest';
import { WebSocketEventResponse } from '../../../../shared/domain/value-objects/WebSocketEventResponse';

describe('ContactManagerDisconnectApplicationService', () => {
  let contactManagerDisconnectApplicationService: ContactManagerDisconnectApplicationService;
  let mockContactManagerDisconnectDomainService: jest.Mocked<ContactManagerDisconnectDomainService>;
  let mockPresenceDomainService: jest.Mocked<PresenceDomainService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContactManagerDisconnectDomainService = {
      handleContactManagerDisconnect: jest.fn(),
    } as any;

    mockPresenceDomainService = {
      setUserOffline: jest.fn(),
      setUserOnline: jest.fn(),
    } as any;

    mockWebPubSubService = {
      broadcastMessage: jest.fn(),
    } as any;

    contactManagerDisconnectApplicationService = new ContactManagerDisconnectApplicationService(
      mockContactManagerDisconnectDomainService,
      mockPresenceDomainService,
      mockWebPubSubService
    );
  });

  describe('constructor', () => {
    it('should create ContactManagerDisconnectApplicationService instance', () => {
      expect(contactManagerDisconnectApplicationService).toBeInstanceOf(ContactManagerDisconnectApplicationService);
    });
  });

  describe('handleContactManagerDisconnect', () => {
    it('should handle contact manager disconnect successfully', async () => {
      const request = {
        userId: 'user-123',
        timestamp: new Date(),
        metadata: { reason: 'user_logout' },
      } as any;

      const expectedResponse = {
        message: 'Contact manager disconnected successfully',
        timestamp: new Date(),
      } as any;

      mockContactManagerDisconnectDomainService.handleContactManagerDisconnect.mockResolvedValue(expectedResponse);

      const result = await contactManagerDisconnectApplicationService.handleContactManagerDisconnect(request);

      expect(mockContactManagerDisconnectDomainService.handleContactManagerDisconnect).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should handle contact manager disconnect with different request types', async () => {
      const request = {
        userId: 'user-456',
        timestamp: new Date(),
        metadata: { reason: 'connection_timeout' },
      } as any;

      const expectedResponse = {
        message: 'Contact manager disconnected due to timeout',
        timestamp: new Date(),
      } as any;

      mockContactManagerDisconnectDomainService.handleContactManagerDisconnect.mockResolvedValue(expectedResponse);

      const result = await contactManagerDisconnectApplicationService.handleContactManagerDisconnect(request);

      expect(mockContactManagerDisconnectDomainService.handleContactManagerDisconnect).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should handle contact manager disconnect errors', async () => {
      const request = {
        userId: 'user-error',
        timestamp: new Date(),
        metadata: { reason: 'system_error' },
      } as any;

      const domainError = new Error('Failed to disconnect contact manager');
      mockContactManagerDisconnectDomainService.handleContactManagerDisconnect.mockRejectedValue(domainError);

      await expect(contactManagerDisconnectApplicationService.handleContactManagerDisconnect(request))
        .rejects.toThrow('Failed to disconnect contact manager');

      expect(mockContactManagerDisconnectDomainService.handleContactManagerDisconnect).toHaveBeenCalledWith(request);
    });

    it('should handle contact manager disconnect with empty metadata', async () => {
      const request = {
        userId: 'user-empty',
        timestamp: new Date(),
        metadata: {},
      } as any;

      const expectedResponse = {
        message: 'Contact manager disconnected',
        timestamp: new Date(),
      } as any;

      mockContactManagerDisconnectDomainService.handleContactManagerDisconnect.mockResolvedValue(expectedResponse);

      const result = await contactManagerDisconnectApplicationService.handleContactManagerDisconnect(request);

      expect(mockContactManagerDisconnectDomainService.handleContactManagerDisconnect).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });

    it('should handle contact manager disconnect with undefined metadata', async () => {
      const request = {
        userId: 'user-undefined',
        timestamp: new Date(),
      } as any;

      const expectedResponse = {
        message: 'Contact manager disconnected',
        timestamp: new Date(),
      } as any;

      mockContactManagerDisconnectDomainService.handleContactManagerDisconnect.mockResolvedValue(expectedResponse);

      const result = await contactManagerDisconnectApplicationService.handleContactManagerDisconnect(request);

      expect(mockContactManagerDisconnectDomainService.handleContactManagerDisconnect).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResponse);
    });
  });
});
