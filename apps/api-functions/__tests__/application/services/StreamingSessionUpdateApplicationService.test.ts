import { StreamingSessionUpdateApplicationService } from '../../../src/application/services/StreamingSessionUpdateApplicationService';
import { StreamingSessionUpdateDomainService } from '../../../src/domain/services';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { StreamingSessionUpdateRequest } from '../../../src/domain/value-objects/StreamingSessionUpdateRequest';
import { StreamingSessionUpdateResponse } from '../../../src/domain/value-objects/StreamingSessionUpdateResponse';
import { StreamingStatus } from '../../../src/domain/enums/StreamingStatus';

describe('StreamingSessionUpdateApplicationService', () => {
  let service: StreamingSessionUpdateApplicationService;
  let mockDomainService: jest.Mocked<StreamingSessionUpdateDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      updateStreamingSession: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new StreamingSessionUpdateApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully update streaming session', async () => {
    const callerId = 'test-caller-id';
    const request = new StreamingSessionUpdateRequest(callerId, StreamingStatus.Started, false);
    const mockResponse = new StreamingSessionUpdateResponse('Session updated successfully', StreamingStatus.Started);

    mockDomainService.updateStreamingSession.mockResolvedValue(mockResponse);

    const result = await service.updateStreamingSession(callerId, request);

    expect(mockDomainService.updateStreamingSession).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

