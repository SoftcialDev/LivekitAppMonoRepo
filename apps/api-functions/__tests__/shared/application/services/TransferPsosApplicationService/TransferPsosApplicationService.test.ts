/**
 * @fileoverview TransferPsosApplicationService - unit tests
 */

import { TransferPsosApplicationService } from '../../../../../shared/application/services/TransferPsosApplicationService';

describe('TransferPsosApplicationService', () => {
  let service: TransferPsosApplicationService;
  let mockDomainService: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockDomainService = {
      transferPsos: jest.fn()
    };
    mockAuthService = {
      authorizeUserQuery: jest.fn()
    };
    service = new TransferPsosApplicationService(mockDomainService, mockAuthService);
  });

  describe('transferPsos', () => {
    it('authorizes and delegates to domain service', async () => {
      const request = { psoEmails: ['pso1@example.com'], newSupervisorEmail: 'supervisor@example.com' } as any;
      const callerId = 'caller123';
      const expectedResult = { transferredCount: 1 } as any;
      
      mockAuthService.authorizeUserQuery.mockResolvedValue(undefined);
      mockDomainService.transferPsos.mockResolvedValue(expectedResult);

      const result = await service.transferPsos(callerId, request);

      expect(mockAuthService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockDomainService.transferPsos).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResult);
    });
  });
});
