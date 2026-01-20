import { FetchStreamingSessionHistoryApplicationService } from '../../../src/application/services/FetchStreamingSessionHistoryApplicationService';
import { IStreamingSessionDomainService } from '../../../src/domain/interfaces/IStreamingSessionDomainService';
import { FetchStreamingSessionHistoryResponse } from '../../../src/domain/value-objects/FetchStreamingSessionHistoryResponse';

describe('FetchStreamingSessionHistoryApplicationService', () => {
  let service: FetchStreamingSessionHistoryApplicationService;
  let mockDomainService: jest.Mocked<IStreamingSessionDomainService>;

  beforeEach(() => {
    mockDomainService = {
      fetchLatestSessionForUser: jest.fn(),
    } as any;

    service = new FetchStreamingSessionHistoryApplicationService(mockDomainService);
  });

  it('should successfully fetch streaming session history', async () => {
    const callerId = 'test-caller-id';
    const mockResponse = new FetchStreamingSessionHistoryResponse(null);

    mockDomainService.fetchLatestSessionForUser.mockResolvedValue(mockResponse);

    const result = await service.fetchStreamingSessionHistory(callerId);

    expect(mockDomainService.fetchLatestSessionForUser).toHaveBeenCalledWith(callerId);
    expect(result).toBe(mockResponse);
  });
});






