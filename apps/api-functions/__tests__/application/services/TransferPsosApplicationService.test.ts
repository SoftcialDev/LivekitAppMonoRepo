import { TransferPsosApplicationService } from '../../../src/application/services/TransferPsosApplicationService';
import { TransferPsosDomainService } from '../../../src/domain/services/TransferPsosDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { TransferPsosRequest } from '../../../src/domain/value-objects/TransferPsosRequest';
import { TransferPsosResponse } from '../../../src/domain/value-objects/TransferPsosResponse';

describe('TransferPsosApplicationService', () => {
  let service: TransferPsosApplicationService;
  let mockDomainService: jest.Mocked<TransferPsosDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      transferPsos: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new TransferPsosApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully transfer PSOs', async () => {
    const callerId = 'test-caller-id';
    const request = new TransferPsosRequest(callerId, 'newsupervisor@example.com');
    const mockResponse = new TransferPsosResponse(5, 'PSOs transferred successfully');

    mockAuthorizationService.authorizeUserQuery.mockResolvedValue(undefined);
    mockDomainService.transferPsos.mockResolvedValue(mockResponse);

    const result = await service.transferPsos(callerId, request);

    expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
    expect(mockDomainService.transferPsos).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const request = new TransferPsosRequest(callerId, 'newsupervisor@example.com');

    mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.transferPsos(callerId, request)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.transferPsos).not.toHaveBeenCalled();
  });
});

