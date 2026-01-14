import { TalkSessionApplicationService } from '../../../src/application/services/TalkSessionApplicationService';
import { TalkSessionDomainService } from '../../../src/domain/services/TalkSessionDomainService';
import { TalkSessionStartRequest } from '../../../src/domain/value-objects/TalkSessionStartRequest';
import { TalkSessionStartResponse } from '../../../src/domain/value-objects/TalkSessionStartResponse';
import { TalkSessionStopRequest } from '../../../src/domain/value-objects/TalkSessionStopRequest';
import { TalkSessionStopResponse } from '../../../src/domain/value-objects/TalkSessionStopResponse';
import { TalkStopReason } from '../../../src/domain/enums/TalkStopReason';

describe('TalkSessionApplicationService', () => {
  let service: TalkSessionApplicationService;
  let mockDomainService: jest.Mocked<TalkSessionDomainService>;

  beforeEach(() => {
    mockDomainService = {
      startTalkSession: jest.fn(),
      stopTalkSession: jest.fn(),
    } as any;

    service = new TalkSessionApplicationService(mockDomainService);
  });

  it('should successfully start talk session', async () => {
    const callerId = 'test-caller-id';
    const request = new TalkSessionStartRequest(callerId, 'pso@example.com');
    const mockResponse = new TalkSessionStartResponse('session-id', 'Talk session started successfully');

    mockDomainService.startTalkSession.mockResolvedValue(mockResponse);

    const result = await service.startTalkSession(callerId, request);

    expect(mockDomainService.startTalkSession).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should successfully stop talk session', async () => {
    const request = new TalkSessionStopRequest('session-id', TalkStopReason.USER_STOP);
    const mockResponse = new TalkSessionStopResponse('Talk session stopped successfully');

    mockDomainService.stopTalkSession.mockResolvedValue(mockResponse);

    const result = await service.stopTalkSession(request);

    expect(mockDomainService.stopTalkSession).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

