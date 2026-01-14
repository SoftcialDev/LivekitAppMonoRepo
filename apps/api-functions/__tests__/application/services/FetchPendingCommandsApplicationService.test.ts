import { FetchPendingCommandsApplicationService } from '../../../src/application/services/FetchPendingCommandsApplicationService';
import { IPendingCommandDomainService } from '../../../src/domain/interfaces/IPendingCommandDomainService';
import { FetchPendingCommandsResponse } from '../../../src/domain/value-objects/FetchPendingCommandsResponse';

describe('FetchPendingCommandsApplicationService', () => {
  let service: FetchPendingCommandsApplicationService;
  let mockDomainService: jest.Mocked<IPendingCommandDomainService>;

  beforeEach(() => {
    mockDomainService = {
      fetchPendingCommands: jest.fn(),
    } as any;

    service = new FetchPendingCommandsApplicationService(mockDomainService);
  });

  it('should successfully fetch pending commands', async () => {
    const callerId = 'test-caller-id';
    const mockResponse = new FetchPendingCommandsResponse(null);

    mockDomainService.fetchPendingCommands.mockResolvedValue(mockResponse);

    const result = await service.fetchPendingCommands(callerId);

    expect(mockDomainService.fetchPendingCommands).toHaveBeenCalledWith(callerId);
    expect(result).toBe(mockResponse);
  });
});

