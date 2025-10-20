/**
 * @fileoverview WebSocketConnectionApplicationService - unit tests
 */

import { WebSocketConnectionApplicationService } from '../../../../../shared/application/services/WebSocketConnectionApplicationService';

describe('WebSocketConnectionApplicationService', () => {
  let service: WebSocketConnectionApplicationService;
  let mockDomainService: any;

  beforeEach(() => {
    mockDomainService = {
      handleConnection: jest.fn(),
      handleDisconnection: jest.fn()
    };
    service = new WebSocketConnectionApplicationService(mockDomainService);
  });

  describe('handleConnection', () => {
    it('delegates to domain service and returns response', async () => {
      const request = { connectionId: 'conn123' } as any;
      const expectedResult = { success: true } as any;
      
      mockDomainService.handleConnection.mockResolvedValue(expectedResult);

      const result = await service.handleConnection(request);

      expect(mockDomainService.handleConnection).toHaveBeenCalledWith(request);
      expect(result).toBe(expectedResult);
    });
  });

  describe('handleDisconnection', () => {
    it('delegates to domain service with context and returns response', async () => {
      const request = { connectionId: 'conn123' } as any;
      const context = { log: { info: jest.fn() } };
      const expectedResult = { success: true } as any;
      
      mockDomainService.handleDisconnection.mockResolvedValue(expectedResult);

      const result = await service.handleDisconnection(request, context);

      expect(mockDomainService.handleDisconnection).toHaveBeenCalledWith(request, context);
      expect(result).toBe(expectedResult);
    });

    it('delegates to domain service without context', async () => {
      const request = { connectionId: 'conn123' } as any;
      const expectedResult = { success: true } as any;
      
      mockDomainService.handleDisconnection.mockResolvedValue(expectedResult);

      const result = await service.handleDisconnection(request);

      expect(mockDomainService.handleDisconnection).toHaveBeenCalledWith(request, undefined);
      expect(result).toBe(expectedResult);
    });
  });
});
