import { GetOrCreateChatApplicationService } from '../../../src/application/services/GetOrCreateChatApplicationService';
import { GetOrCreateChatDomainService } from '../../../src/domain/services/GetOrCreateChatDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { GetOrCreateChatRequest } from '../../../src/domain/value-objects/GetOrCreateChatRequest';
import { GetOrCreateChatResponse } from '../../../src/domain/value-objects/GetOrCreateChatResponse';

describe('GetOrCreateChatApplicationService', () => {
  let service: GetOrCreateChatApplicationService;
  let mockDomainService: jest.Mocked<GetOrCreateChatDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      getOrCreateChat: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new GetOrCreateChatApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully get or create chat', async () => {
    const callerId = 'test-caller-id';
    const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
    const token = 'test-token';
    const mockResponse = new GetOrCreateChatResponse('chat-id-123');

    mockAuthorizationService.authorizeUserQuery.mockResolvedValue(undefined);
    mockDomainService.getOrCreateChat.mockResolvedValue(mockResponse);

    const result = await service.getOrCreateChat(callerId, request, token);

    expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
    expect(mockDomainService.getOrCreateChat).toHaveBeenCalledWith(request, token);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
    const token = 'test-token';

    mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.getOrCreateChat).not.toHaveBeenCalled();
  });
});

