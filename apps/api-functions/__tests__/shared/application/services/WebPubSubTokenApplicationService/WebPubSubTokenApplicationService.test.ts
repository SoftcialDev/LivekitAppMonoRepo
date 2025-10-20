/**
 * @fileoverview WebPubSubTokenApplicationService - unit tests
 */

import { WebPubSubTokenApplicationService } from '../../../../../shared/application/services/WebPubSubTokenApplicationService';

describe('WebPubSubTokenApplicationService', () => {
  let service: WebPubSubTokenApplicationService;
  let mockDomainService: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockDomainService = {
      generateTokenForUser: jest.fn()
    };
    mockAuthService = {};
    service = new WebPubSubTokenApplicationService(mockDomainService, mockAuthService);
  });

  describe('generateToken', () => {
    it('delegates to domain service and returns response', async () => {
      const request = { userId: 'user123' } as any;
      const callerId = 'caller123';
      const expectedResult = { token: 'abc123' } as any;
      
      mockDomainService.generateTokenForUser.mockResolvedValue(expectedResult);

      const result = await service.generateToken(callerId, request);

      expect(mockDomainService.generateTokenForUser).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResult);
    });
  });
});
