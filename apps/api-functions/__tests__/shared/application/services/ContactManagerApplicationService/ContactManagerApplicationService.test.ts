/**
 * @fileoverview ContactManagerApplicationService - unit tests
 */

import { ContactManagerApplicationService } from '../../../../../shared/application/services/ContactManagerApplicationService';

describe('ContactManagerApplicationService', () => {
  let service: ContactManagerApplicationService;
  let mockDomainService: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockDomainService = {
      createContactManager: jest.fn(),
      deleteContactManager: jest.fn(),
      listContactManagers: jest.fn(),
      getMyContactManagerStatus: jest.fn(),
      updateMyContactManagerStatus: jest.fn()
    };
    mockAuthService = {
      canAccessAdmin: jest.fn(),
      canAccessContactManager: jest.fn()
    };
    service = new ContactManagerApplicationService(mockDomainService, mockAuthService);
  });

  describe('createContactManager', () => {
    it('authorizes and delegates to domain service', async () => {
      const request = { name: 'Test Manager' } as any;
      const callerId = 'caller123';
      const expectedResult = { id: 'cm1', name: 'Test Manager' } as any;
      
      mockAuthService.canAccessAdmin.mockResolvedValue(undefined);
      mockDomainService.createContactManager.mockResolvedValue(expectedResult);

      const result = await service.createContactManager(request, callerId);

      expect(mockAuthService.canAccessAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.createContactManager).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResult);
    });
  });

  describe('deleteContactManager', () => {
    it('authorizes and delegates to domain service', async () => {
      const request = { id: 'cm1' } as any;
      const callerId = 'caller123';
      
      mockAuthService.canAccessAdmin.mockResolvedValue(undefined);
      mockDomainService.deleteContactManager.mockResolvedValue(undefined);

      await service.deleteContactManager(request, callerId);

      expect(mockAuthService.canAccessAdmin).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.deleteContactManager).toHaveBeenCalledWith(request);
    });
  });

  describe('listContactManagers', () => {
    it('delegates to domain service without additional auth', async () => {
      const callerId = 'caller123';
      const expectedResult = { managers: [] } as any;
      
      mockDomainService.listContactManagers.mockResolvedValue(expectedResult);

      const result = await service.listContactManagers(callerId);

      expect(mockDomainService.listContactManagers).toHaveBeenCalledWith();
      expect(result).toBe(expectedResult);
    });
  });

  describe('getMyContactManagerStatus', () => {
    it('authorizes and delegates to domain service', async () => {
      const callerId = 'caller123';
      const expectedResult = { status: 'active' } as any;
      
      mockAuthService.canAccessContactManager.mockResolvedValue(undefined);
      mockDomainService.getMyContactManagerStatus.mockResolvedValue(expectedResult);

      const result = await service.getMyContactManagerStatus(callerId);

      expect(mockAuthService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.getMyContactManagerStatus).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResult);
    });
  });

  describe('updateMyContactManagerStatus', () => {
    it('authorizes and delegates to domain service', async () => {
      const request = { status: 'inactive' } as any;
      const callerId = 'caller123';
      const expectedResult = { status: 'inactive' } as any;
      
      mockAuthService.canAccessContactManager.mockResolvedValue(undefined);
      mockDomainService.updateMyContactManagerStatus.mockResolvedValue(expectedResult);

      const result = await service.updateMyContactManagerStatus(request, callerId);

      expect(mockAuthService.canAccessContactManager).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.updateMyContactManagerStatus).toHaveBeenCalledWith(callerId, request);
      expect(result).toBe(expectedResult);
    });
  });
});