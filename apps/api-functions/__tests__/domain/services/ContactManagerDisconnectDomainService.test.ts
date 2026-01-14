import { ContactManagerDisconnectDomainService } from '../../../src/domain/services/ContactManagerDisconnectDomainService';
import { ICommandMessagingService } from '../../../src/domain/interfaces/ICommandMessagingService';
import { WebSocketEventRequest } from '../../../src/domain/value-objects/WebSocketEventRequest';
import { WebSocketEventResponse } from '../../../src/domain/value-objects/WebSocketEventResponse';
import { ContactManagerStatus } from '@prisma/client';
import { createMockCommandMessagingService } from './domainServiceTestSetup';
import prisma from '../../../src/infrastructure/database/PrismaClientService';

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../../../src/infrastructure/database/PrismaClientService', () => ({
  __esModule: true,
  default: {
    contactManagerProfile: {
      findUnique: jest.fn((args) => mockFindUnique(args)),
      update: jest.fn((args) => mockUpdate(args)),
    },
  },
}));

describe('ContactManagerDisconnectDomainService', () => {
  let service: ContactManagerDisconnectDomainService;
  let mockCommandMessagingService: jest.Mocked<ICommandMessagingService>;

  beforeEach(() => {
    mockCommandMessagingService = createMockCommandMessagingService();
    service = new ContactManagerDisconnectDomainService(mockCommandMessagingService);
    jest.clearAllMocks();
  });

  describe('handleContactManagerDisconnect', () => {
    it('should skip processing if phase is not disconnected', async () => {
      const request = new WebSocketEventRequest('user-id', 'conn-id', 'hub', 'connect', {});

      const result = await service.handleContactManagerDisconnect(request);

      expect(result.status).toBe(200);
      expect(result.message).toContain('Not a disconnection event');
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it('should skip processing if user is not a Contact Manager', async () => {
      const request = new WebSocketEventRequest('user-id', 'conn-id', 'hub', 'disconnected', {});

      mockFindUnique.mockResolvedValue(null);

      const result = await service.handleContactManagerDisconnect(request);

      expect(result.status).toBe(200);
      expect(result.message).toContain('User is not a Contact Manager');
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should update Contact Manager status to Unavailable and broadcast', async () => {
      const request = new WebSocketEventRequest('user-id', 'conn-id', 'hub', 'disconnected', {});
      const mockProfile = {
        userId: 'user-id',
        status: ContactManagerStatus.Available,
        updatedAt: new Date(),
      };
      const updatedProfile = {
        ...mockProfile,
        status: ContactManagerStatus.Unavailable,
        updatedAt: new Date(),
      };

      mockFindUnique.mockResolvedValue(mockProfile as any);
      mockUpdate.mockResolvedValue(updatedProfile as any);
      mockCommandMessagingService.sendToGroup.mockResolvedValue(undefined);

      const result = await service.handleContactManagerDisconnect(request);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        data: { status: ContactManagerStatus.Unavailable },
      });
      expect(mockCommandMessagingService.sendToGroup).toHaveBeenCalledWith('cm-status-updates', {
        managerId: 'user-id',
        status: ContactManagerStatus.Unavailable,
        updatedAt: expect.any(String),
      });
      expect(result.status).toBe(200);
      expect(result.message).toContain('status updated successfully');
    });

    it('should return error response when database operation fails', async () => {
      const request = new WebSocketEventRequest('user-id', 'conn-id', 'hub', 'disconnected', {});

      mockFindUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.handleContactManagerDisconnect(request);

      expect(result.status).toBe(500);
      expect(result.message).toContain('Failed to handle Contact Manager disconnect');
    });
  });
});

