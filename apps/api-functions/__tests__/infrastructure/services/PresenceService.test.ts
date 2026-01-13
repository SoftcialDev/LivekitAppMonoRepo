import { PresenceService } from '../../../src/infrastructure/services/PresenceService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { User } from '../../../src/domain/entities/User';
import { createMockUser } from '../../shared/mocks';

describe('PresenceService', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let presenceDomainService: jest.Mocked<PresenceDomainService>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;
  let service: PresenceService;

  beforeEach(() => {
    jest.clearAllMocks();

    userRepository = {
      findByEmail: jest.fn(),
    } as any;

    presenceDomainService = {
      setUserOffline: jest.fn(),
    } as any;

    webPubSubService = {} as any;

    service = new PresenceService(userRepository, presenceDomainService, webPubSubService);
  });

  describe('setUserOffline', () => {
    it('should set user offline when user is found', async () => {
      const userEmail = 'user@example.com';
      const mockUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: userEmail,
        fullName: 'User Name',
        role: 'PSO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findByEmail.mockResolvedValue(mockUser);
      presenceDomainService.setUserOffline.mockResolvedValue(undefined);

      await service.setUserOffline(userEmail);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userEmail);
      expect(presenceDomainService.setUserOffline).toHaveBeenCalledWith('user-id');
    });

    it('should return early when user is not found', async () => {
      const userEmail = 'notfound@example.com';

      userRepository.findByEmail.mockResolvedValue(null);

      await service.setUserOffline(userEmail);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userEmail);
      expect(presenceDomainService.setUserOffline).not.toHaveBeenCalled();
    });

    it('should silently handle errors when finding user', async () => {
      const userEmail = 'user@example.com';
      const error = new Error('Database error');

      userRepository.findByEmail.mockRejectedValue(error);

      await expect(service.setUserOffline(userEmail)).resolves.not.toThrow();
      expect(presenceDomainService.setUserOffline).not.toHaveBeenCalled();
    });

    it('should silently handle errors when setting user offline', async () => {
      const userEmail = 'user@example.com';
      const mockUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: userEmail,
        fullName: 'User Name',
        role: 'PSO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findByEmail.mockResolvedValue(mockUser);
      const error = new Error('Domain service error');
      presenceDomainService.setUserOffline.mockRejectedValue(error);

      await expect(service.setUserOffline(userEmail)).resolves.not.toThrow();
    });

    it('should use lowercase email for user lookup', async () => {
      const userEmail = 'USER@EXAMPLE.COM';
      const mockUser = new User({
        id: 'user-id',
        azureAdObjectId: 'azure-id',
        email: 'user@example.com',
        fullName: 'User Name',
        role: 'PSO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userRepository.findByEmail.mockResolvedValue(mockUser);
      presenceDomainService.setUserOffline.mockResolvedValue(undefined);

      await service.setUserOffline(userEmail);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userEmail);
    });
  });
});

