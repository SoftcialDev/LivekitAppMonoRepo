import { LiveKitTokenApplicationService } from '../../../src/application/services/LiveKitTokenApplicationService';
import { LiveKitTokenDomainService } from '../../../src/domain/services/LiveKitTokenDomainService';
import { LiveKitTokenRequest } from '../../../src/domain/value-objects/LiveKitTokenRequest';
import { LiveKitTokenResponse } from '../../../src/domain/value-objects/LiveKitTokenResponse';

describe('LiveKitTokenApplicationService', () => {
  let service: LiveKitTokenApplicationService;
  let mockDomainService: jest.Mocked<LiveKitTokenDomainService>;

  beforeEach(() => {
    mockDomainService = {
      generateTokenForUser: jest.fn(),
    } as any;

    service = new LiveKitTokenApplicationService(mockDomainService);
  });

  it('should successfully generate LiveKit token', async () => {
    const callerId = 'test-caller-id';
    const request = new LiveKitTokenRequest(callerId, 'user-id');
    const mockResponse = new LiveKitTokenResponse(
      [{ room: 'room-id', token: 'token-string' }],
      'https://livekit.example.com'
    );

    mockDomainService.generateTokenForUser.mockResolvedValue(mockResponse);

    const result = await service.generateToken(callerId, request);

    expect(mockDomainService.generateTokenForUser).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

