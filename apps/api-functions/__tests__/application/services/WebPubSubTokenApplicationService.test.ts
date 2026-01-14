import { WebPubSubTokenApplicationService } from '../../../src/application/services/WebPubSubTokenApplicationService';
import { WebPubSubTokenDomainService } from '../../../src/domain/services/WebPubSubTokenDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { WebPubSubTokenRequest } from '../../../src/domain/value-objects/WebPubSubTokenRequest';
import { WebPubSubTokenResponse } from '../../../src/domain/value-objects/WebPubSubTokenResponse';

describe('WebPubSubTokenApplicationService', () => {
  let service: WebPubSubTokenApplicationService;
  let mockDomainService: jest.Mocked<WebPubSubTokenDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      generateTokenForUser: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new WebPubSubTokenApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully generate WebPubSub token', async () => {
    const callerId = 'test-caller-id';
    const request = new WebPubSubTokenRequest(callerId);
    const mockResponse = new WebPubSubTokenResponse('token-string', 'https://endpoint.example.com', 'hub-name', []);

    mockDomainService.generateTokenForUser.mockResolvedValue(mockResponse);

    const result = await service.generateToken(callerId, request);

    expect(mockDomainService.generateTokenForUser).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

