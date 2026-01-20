import { WebPubSubTokenDomainService } from '../../../src/domain/services/WebPubSubTokenDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../src/domain/interfaces/IWebPubSubService';
import { WebPubSubTokenRequest } from '../../../src/domain/value-objects/WebPubSubTokenRequest';
import { WebPubSubTokenResponse } from '../../../src/domain/value-objects/WebPubSubTokenResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { createMockUserRepository, createMockWebPubSubService, createMockUser } from './domainServiceTestSetup';
import { UserRole } from '@prisma/client';
import { WebPubSubGroups } from '../../../src/domain/constants/WebPubSubGroups';

jest.mock('../../../src/config', () => ({
  config: {
    webPubSubEndpoint: 'https://wps.example.com',
    webPubSubHubName: 'test-hub',
  },
}));

describe('WebPubSubTokenDomainService', () => {
  let service: WebPubSubTokenDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockWebPubSubService = createMockWebPubSubService();
    service = new WebPubSubTokenDomainService(mockUserRepository, mockWebPubSubService);
  });

  describe('generateTokenForUser', () => {
    it('should generate token for PSO user', async () => {
      const request = new WebPubSubTokenRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'pso@example.com',
        role: UserRole.PSO,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockWebPubSubService.generateToken.mockResolvedValue('token-string');

      const result = await service.generateTokenForUser(request);

      expect(mockWebPubSubService.generateToken).toHaveBeenCalledWith(
        'pso@example.com',
        ['pso@example.com', WebPubSubGroups.PRESENCE, WebPubSubGroups.CM_STATUS_UPDATES]
      );
      expect(result.token).toBe('token-string');
      expect(result.groups).toContain('pso@example.com');
      expect(result.groups).toContain(WebPubSubGroups.PRESENCE);
    });

    it('should generate token for Supervisor user', async () => {
      const request = new WebPubSubTokenRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: 'supervisor@example.com',
        role: UserRole.Supervisor,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockWebPubSubService.generateToken.mockResolvedValue('token-string');

      const result = await service.generateTokenForUser(request);

      expect(mockWebPubSubService.generateToken).toHaveBeenCalledWith(
        'supervisor@example.com',
        [WebPubSubGroups.PRESENCE]
      );
      expect(result.groups).toEqual([WebPubSubGroups.PRESENCE]);
    });

    it('should throw error when user not found', async () => {
      const request = new WebPubSubTokenRequest('caller-id');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.generateTokenForUser(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when user is deleted', async () => {
      const request = new WebPubSubTokenRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        deletedAt: new Date(),
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);

      await expect(service.generateTokenForUser(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should normalize email in groups', async () => {
      const request = new WebPubSubTokenRequest('caller-id');
      const user = createMockUser({
        id: 'user-id',
        azureAdObjectId: 'caller-id',
        email: '  PSO@EXAMPLE.COM  ',
        role: UserRole.PSO,
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(user);
      mockWebPubSubService.generateToken.mockResolvedValue('token-string');

      await service.generateTokenForUser(request);

      expect(mockWebPubSubService.generateToken).toHaveBeenCalledWith(
        '  pso@example.com  ',
        expect.arrayContaining(['pso@example.com'])
      );
    });
  });
});





