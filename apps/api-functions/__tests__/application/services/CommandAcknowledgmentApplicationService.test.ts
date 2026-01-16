import { CommandAcknowledgmentApplicationService } from '../../../src/application/services/CommandAcknowledgmentApplicationService';
import { ICommandAcknowledgmentService } from '../../../src/domain/interfaces';
import { IAuthorizationService } from '../../../src/domain/interfaces/IAuthorizationService';
import { AcknowledgeCommandRequest } from '../../../src/domain/value-objects/AcknowledgeCommandRequest';
import { AcknowledgeCommandResult } from '../../../src/domain/value-objects/AcknowledgeCommandResult';

describe('CommandAcknowledgmentApplicationService', () => {
  let service: CommandAcknowledgmentApplicationService;
  let mockCommandAcknowledgmentService: jest.Mocked<ICommandAcknowledgmentService>;
  let mockAuthorizationService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    mockCommandAcknowledgmentService = {
      acknowledgeCommands: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new CommandAcknowledgmentApplicationService(
      mockCommandAcknowledgmentService,
      mockAuthorizationService
    );
  });

  it('should successfully acknowledge commands', async () => {
    const callerId = 'test-caller-id';
    const request = new AcknowledgeCommandRequest(['command-1', 'command-2']);
    const mockResult = new AcknowledgeCommandResult(2);

    mockCommandAcknowledgmentService.acknowledgeCommands.mockResolvedValue(mockResult);

    const result = await service.acknowledgeCommands(request, callerId);

    expect(mockCommandAcknowledgmentService.acknowledgeCommands).toHaveBeenCalledWith(request, callerId);
    expect(result).toBe(mockResult);
  });
});



