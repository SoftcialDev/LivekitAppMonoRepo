import { ProcessCommandApplicationService } from '../../../src/application/services/ProcessCommandApplicationService';
import { ProcessCommandDomainService } from '../../../src/domain/services/ProcessCommandDomainService';
import { ProcessCommandRequest } from '../../../src/domain/value-objects/ProcessCommandRequest';
import { ProcessCommandResponse } from '../../../src/domain/value-objects/ProcessCommandResponse';
import { CommandType } from '../../../src/domain/enums/CommandType';

describe('ProcessCommandApplicationService', () => {
  let service: ProcessCommandApplicationService;
  let mockDomainService: jest.Mocked<ProcessCommandDomainService>;

  beforeEach(() => {
    mockDomainService = {
      processCommand: jest.fn(),
    } as any;

    service = new ProcessCommandApplicationService(mockDomainService);
  });

  it('should successfully process command', async () => {
    const request = new ProcessCommandRequest(
      'START' as any,
      'employee@example.com',
      new Date()
    );
    const mockResponse = new ProcessCommandResponse('command-id', true, 'processed');

    mockDomainService.processCommand.mockResolvedValue(mockResponse);

    const result = await service.processCommand(request);

    expect(mockDomainService.processCommand).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

