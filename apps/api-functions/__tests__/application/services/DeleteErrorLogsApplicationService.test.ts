import { DeleteErrorLogsApplicationService } from '../../../src/application/services/DeleteErrorLogsApplicationService';
import { DeleteErrorLogsDomainService } from '../../../src/domain/services/DeleteErrorLogsDomainService';

describe('DeleteErrorLogsApplicationService', () => {
  let service: DeleteErrorLogsApplicationService;
  let mockDomainService: jest.Mocked<DeleteErrorLogsDomainService>;

  beforeEach(() => {
    mockDomainService = {
      deleteErrorLogs: jest.fn(),
      deleteAll: jest.fn(),
    } as any;

    service = new DeleteErrorLogsApplicationService(mockDomainService);
  });

  it('should successfully delete error logs by ids', async () => {
    const ids = ['id-1', 'id-2', 'id-3'];

    mockDomainService.deleteErrorLogs.mockResolvedValue(undefined);

    await service.deleteErrorLogs(ids);

    expect(mockDomainService.deleteErrorLogs).toHaveBeenCalledWith(ids);
  });

  it('should successfully delete all error logs', async () => {
    mockDomainService.deleteAll.mockResolvedValue(undefined);

    await service.deleteAll();

    expect(mockDomainService.deleteAll).toHaveBeenCalled();
  });
});



