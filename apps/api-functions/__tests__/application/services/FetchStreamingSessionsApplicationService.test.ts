import { FetchStreamingSessionsApplicationService } from '../../../src/application/services/FetchStreamingSessionsApplicationService';
import { IStreamingSessionDomainService } from '../../../src/domain/interfaces/IStreamingSessionDomainService';
import { FetchStreamingSessionsResponse } from '../../../src/domain/value-objects/FetchStreamingSessionsResponse';

describe('FetchStreamingSessionsApplicationService', () => {
  let service: FetchStreamingSessionsApplicationService;
  let mockDomainService: jest.Mocked<IStreamingSessionDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getAllActiveSessions: jest.fn(),
    } as any;

    service = new FetchStreamingSessionsApplicationService(mockDomainService);
  });

  it('should successfully fetch streaming sessions', async () => {
    const callerId = 'test-caller-id';
    const mockResponse = new FetchStreamingSessionsResponse([]);

    mockDomainService.getAllActiveSessions.mockResolvedValue(mockResponse);

    const result = await service.fetchStreamingSessions(callerId);

    expect(mockDomainService.getAllActiveSessions).toHaveBeenCalledWith(callerId);
    expect(result).toBe(mockResponse);
  });
});


