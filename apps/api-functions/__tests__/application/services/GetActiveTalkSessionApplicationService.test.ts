import { GetActiveTalkSessionApplicationService } from '../../../src/application/services/GetActiveTalkSessionApplicationService';
import { GetActiveTalkSessionDomainService } from '../../../src/domain/services/GetActiveTalkSessionDomainService';
import { GetActiveTalkSessionRequest } from '../../../src/domain/value-objects/GetActiveTalkSessionRequest';
import { GetActiveTalkSessionResponse } from '../../../src/domain/value-objects/GetActiveTalkSessionResponse';

describe('GetActiveTalkSessionApplicationService', () => {
  let service: GetActiveTalkSessionApplicationService;
  let mockDomainService: jest.Mocked<GetActiveTalkSessionDomainService>;

  beforeEach(() => {
    mockDomainService = {
      getActiveTalkSession: jest.fn(),
    } as any;

    service = new GetActiveTalkSessionApplicationService(mockDomainService);
  });

  it('should successfully get active talk session', async () => {
    const callerId = 'test-caller-id';
    const request = new GetActiveTalkSessionRequest(callerId, 'pso@example.com');
    const mockResponse = new GetActiveTalkSessionResponse(false);

    mockDomainService.getActiveTalkSession.mockResolvedValue(mockResponse);

    const result = await service.getActiveTalkSession(callerId, request);

    expect(mockDomainService.getActiveTalkSession).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

