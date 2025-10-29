import { WebPubSubTokenDomainService } from '../../../../shared/domain/services/WebPubSubTokenDomainService';
import { WebPubSubTokenRequest } from '../../../../shared/domain/value-objects/WebPubSubTokenRequest';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';
import { UserNotFoundError } from '../../../../shared/domain/errors/UserErrors';
import { UserRole } from '../../../../shared/domain/enums/UserRole';

jest.mock('../../../../shared/config', () => ({ config: { webPubSubEndpoint: 'https://test-endpoint.com', webPubSubHubName: 'test-hub' } }));

describe('WebPubSubTokenDomainService', () => {
  let service: WebPubSubTokenDomainService;
  let userRepository: jest.Mocked<IUserRepository>;
  let webPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByAzureAdObjectId: jest.fn() } as any;
    webPubSubService = { generateToken: jest.fn() } as any;
    service = new WebPubSubTokenDomainService(userRepository, webPubSubService);
  });

  describe('generateTokenForUser', () => {
    it('should generate token for Employee with correct groups', async () => {
      const mockUser = { id: 'user-123', email: 'employee@example.com', role: UserRole.Employee, deletedAt: null };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      webPubSubService.generateToken.mockResolvedValue('mock-token');
      const request = new WebPubSubTokenRequest('caller-123');
      const result = await service.generateTokenForUser(request);
      expect(webPubSubService.generateToken).toHaveBeenCalledWith('employee@example.com', expect.arrayContaining(['employee@example.com', 'cm-status-updates', 'presence']));
      expect(result.token).toBe('mock-token');
    });

    it('should generate token for Admin with only presence group', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com', role: UserRole.Admin, deletedAt: null };
      userRepository.findByAzureAdObjectId.mockResolvedValue(mockUser as any);
      webPubSubService.generateToken.mockResolvedValue('mock-token');
      const request = new WebPubSubTokenRequest('caller-123');
      const result = await service.generateTokenForUser(request);
      expect(result.groups).toEqual(['presence']);
    });

    it('should throw UserNotFoundError when user not found', async () => {
      userRepository.findByAzureAdObjectId.mockResolvedValue(null);
      const request = new WebPubSubTokenRequest('caller-123');
      await expect(service.generateTokenForUser(request)).rejects.toThrow(UserNotFoundError);
    });
  });
});
