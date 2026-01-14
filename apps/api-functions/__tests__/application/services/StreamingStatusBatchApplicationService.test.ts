import { StreamingStatusBatchApplicationService } from '../../../src/application/services/StreamingStatusBatchApplicationService';
import { StreamingStatusBatchDomainService } from '../../../src/domain/services/StreamingStatusBatchDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { StreamingStatusBatchResponse } from '../../../src/domain/value-objects/StreamingStatusBatchResponse';

describe('StreamingStatusBatchApplicationService', () => {
  let service: StreamingStatusBatchApplicationService;
  let mockDomainService: jest.Mocked<StreamingStatusBatchDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      getBatchStreamingStatus: jest.fn(),
    } as any;

    mockAuthorizationService = {
      canAccessStreamingStatus: jest.fn(),
    } as any;

    service = new StreamingStatusBatchApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully get batch streaming status', async () => {
    const callerId = 'test-caller-id';
    const emails = ['user1@example.com', 'user2@example.com'];
    const mockResponse = new StreamingStatusBatchResponse([]);

    mockAuthorizationService.canAccessStreamingStatus.mockResolvedValue(undefined);
    mockDomainService.getBatchStreamingStatus.mockResolvedValue(mockResponse);

    const result = await service.getBatchStatus(emails, callerId);

    expect(mockAuthorizationService.canAccessStreamingStatus).toHaveBeenCalledWith(callerId);
    expect(mockDomainService.getBatchStreamingStatus).toHaveBeenCalledWith(emails);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const emails = ['user1@example.com'];

    mockAuthorizationService.canAccessStreamingStatus.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.getBatchStatus(emails, callerId)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.getBatchStreamingStatus).not.toHaveBeenCalled();
  });
});

