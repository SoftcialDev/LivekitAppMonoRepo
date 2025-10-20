/**
 * @fileoverview SuperAdminApplicationService - unit tests
 */

import { SuperAdminApplicationService } from '../../../../../shared/application/services/SuperAdminApplicationService';

describe('SuperAdminApplicationService', () => {
  let service: SuperAdminApplicationService;
  let mockDomainService: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockDomainService = {
      createSuperAdmin: jest.fn(),
      deleteSuperAdmin: jest.fn(),
      listSuperAdmins: jest.fn()
    };
    mockAuthService = {
      canAccessSuperAdmin: jest.fn()
    };
    service = new SuperAdminApplicationService(mockDomainService, mockAuthService);
  });

  describe('createSuperAdmin', () => {
    it('authorizes and delegates to domain service', async () => {
      const request = { name: 'Test SuperAdmin' } as any;
      const callerId = 'caller123';
      const expectedResult = { id: 'sa1', name: 'Test SuperAdmin' } as any;
      
      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDomainService.createSuperAdmin.mockResolvedValue(expectedResult);

      const result = await service.createSuperAdmin(request, callerId);

      expect(mockAuthService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.createSuperAdmin).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResult);
    });
  });

  describe('deleteSuperAdmin', () => {
    it('authorizes and delegates to domain service', async () => {
      const request = { id: 'sa1' } as any;
      const callerId = 'caller123';
      
      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDomainService.deleteSuperAdmin.mockResolvedValue(undefined);

      await service.deleteSuperAdmin(request, callerId);

      expect(mockAuthService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.deleteSuperAdmin).toHaveBeenCalledWith(request);
    });
  });

  describe('listSuperAdmins', () => {
    it('authorizes and delegates to domain service', async () => {
      const callerId = 'caller123';
      const expectedResult = { superAdmins: [] } as any;
      
      mockAuthService.canAccessSuperAdmin.mockResolvedValue(undefined);
      mockDomainService.listSuperAdmins.mockResolvedValue(expectedResult);

      const result = await service.listSuperAdmins(callerId);

      expect(mockAuthService.canAccessSuperAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.listSuperAdmins).toHaveBeenCalledWith();
      expect(result).toBe(expectedResult);
    });
  });
});
