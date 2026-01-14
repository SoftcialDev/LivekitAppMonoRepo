import { SuperAdminApplicationService } from '../../../src/application/services/SuperAdminApplicationService';
import { SuperAdminDomainService } from '../../../src/domain/services/SuperAdminDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { CreateSuperAdminRequest } from '../../../src/domain/value-objects/CreateSuperAdminRequest';
import { DeleteSuperAdminRequest } from '../../../src/domain/value-objects/DeleteSuperAdminRequest';
import { SuperAdminListResponse } from '../../../src/domain/value-objects/SuperAdminListResponse';
import { SuperAdminProfile } from '../../../src/domain/entities/SuperAdminProfile';

describe('SuperAdminApplicationService', () => {
  let service: SuperAdminApplicationService;
  let mockDomainService: jest.Mocked<SuperAdminDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      createSuperAdmin: jest.fn(),
      deleteSuperAdmin: jest.fn(),
      listSuperAdmins: jest.fn(),
    } as any;

    mockAuthorizationService = {
      canAccessSuperAdmin: jest.fn(),
    } as any;

    service = new SuperAdminApplicationService(mockDomainService, mockAuthorizationService);
  });

  describe('createSuperAdmin', () => {
    it('should successfully create super admin', async () => {
      const callerId = 'test-caller-id';
      const request = new CreateSuperAdminRequest('admin@example.com');
      const mockProfile = new SuperAdminProfile(
        'profile-id',
        'user-id',
        new Date(),
        new Date(),
        {
          email: 'admin@example.com',
          fullName: 'Admin User',
        }
      );

      mockDomainService.createSuperAdmin.mockResolvedValue(mockProfile);

      const result = await service.createSuperAdmin(request, callerId);

      expect(mockDomainService.createSuperAdmin).toHaveBeenCalledWith(request);
      expect(result).toBe(mockProfile);
    });
  });

  describe('deleteSuperAdmin', () => {
    it('should successfully delete super admin', async () => {
      const callerId = 'test-caller-id';
      const request = new DeleteSuperAdminRequest('admin@example.com');

      mockDomainService.deleteSuperAdmin.mockResolvedValue(undefined);

      await service.deleteSuperAdmin(request, callerId);

      expect(mockDomainService.deleteSuperAdmin).toHaveBeenCalledWith(request);
    });
  });

  describe('listSuperAdmins', () => {
    it('should successfully list super admins', async () => {
      const callerId = 'test-caller-id';
      const mockResponse = new SuperAdminListResponse([], 0);

      mockAuthorizationService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDomainService.listSuperAdmins.mockResolvedValue(mockResponse);

      const result = await service.listSuperAdmins(callerId);

      expect(mockAuthorizationService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.listSuperAdmins).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('should throw error when authorization fails', async () => {
      const callerId = 'test-caller-id';

      mockAuthorizationService.canAccessSuperAdmin.mockRejectedValue(new Error('Unauthorized'));

      await expect(service.listSuperAdmins(callerId)).rejects.toThrow('Unauthorized');
      expect(mockDomainService.listSuperAdmins).not.toHaveBeenCalled();
    });
  });
});

