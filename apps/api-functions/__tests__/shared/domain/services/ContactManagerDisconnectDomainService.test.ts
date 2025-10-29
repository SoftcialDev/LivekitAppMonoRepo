// Mock Prisma enums using centralized mock
jest.mock('@prisma/client', () => require('../../../mocks/prisma-enums').PrismaMock);
jest.mock('../../../../shared/infrastructure/database/PrismaClientService', () => ({ __esModule: true, default: { contactManagerProfile: { findUnique: jest.fn(), update: jest.fn() } } }));

import { ContactManagerDisconnectDomainService } from '../../../../shared/domain/services/ContactManagerDisconnectDomainService';
import { WebSocketEventRequest } from '../../../../shared/domain/value-objects/WebSocketEventRequest';
import { ICommandMessagingService } from '../../../../shared/domain/interfaces/ICommandMessagingService';

import prisma from '../../../../shared/infrastructure/database/PrismaClientService';

describe('ContactManagerDisconnectDomainService', () => {
  let service: ContactManagerDisconnectDomainService;
  let commandMessagingService: jest.Mocked<ICommandMessagingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    commandMessagingService = { sendToGroup: jest.fn() } as any;
    service = new ContactManagerDisconnectDomainService(commandMessagingService);
  });

  describe('handleContactManagerDisconnect', () => {
    it('should skip non-disconnection events', async () => {
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'connected', { phase: 'connected' });
      const result = await service.handleContactManagerDisconnect(request);
      expect(result.message).toContain('Not a disconnection event');
    });

    it('should skip non-contact-manager users', async () => {
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockResolvedValue(null);
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'disconnected', { phase: 'disconnected' });
      const result = await service.handleContactManagerDisconnect(request);
      expect(result.message).toContain('not a Contact Manager');
    });

    it('should update contact manager status to Unavailable', async () => {
      const mockProfile = { id: 'profile-123', userId: 'user-123', status: 'Available' };
      const mockUpdatedProfile = { userId: 'user-123', status: 'Unavailable', updatedAt: new Date() };
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);
      (prisma.contactManagerProfile.update as jest.Mock).mockResolvedValue(mockUpdatedProfile);
      commandMessagingService.sendToGroup = jest.fn().mockResolvedValue(undefined);
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'disconnected', { phase: 'disconnected' });
      const result = await service.handleContactManagerDisconnect(request);
      expect(commandMessagingService.sendToGroup).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (prisma.contactManagerProfile.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
      const request = new WebSocketEventRequest('user-123', 'conn-123', 'hub-1', 'disconnected', { phase: 'disconnected' });
      const result = await service.handleContactManagerDisconnect(request);
      expect(result.message).toContain('Failed to handle Contact Manager disconnect');
    });
  });
});