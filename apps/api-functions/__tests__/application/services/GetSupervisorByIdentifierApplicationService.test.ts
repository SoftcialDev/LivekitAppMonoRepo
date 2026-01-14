import { GetSupervisorByIdentifierApplicationService } from '../../../src/application/services/GetSupervisorByIdentifierApplicationService';
import { GetSupervisorByIdentifierDomainService } from '../../../src/domain/services/GetSupervisorByIdentifierDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { GetSupervisorByIdentifierRequest } from '../../../src/domain/value-objects/GetSupervisorByIdentifierRequest';
import { GetSupervisorByIdentifierResponse } from '../../../src/domain/value-objects/GetSupervisorByIdentifierResponse';

describe('GetSupervisorByIdentifierApplicationService', () => {
  let service: GetSupervisorByIdentifierApplicationService;
  let mockDomainService: jest.Mocked<GetSupervisorByIdentifierDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      getSupervisorByIdentifier: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new GetSupervisorByIdentifierApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should successfully get supervisor by identifier', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorByIdentifierRequest('supervisor@example.com');
    const mockResponse = new GetSupervisorByIdentifierResponse({
      id: 'supervisor-id',
      azureAdObjectId: 'supervisor-azure-id',
      email: 'supervisor@example.com',
      fullName: 'Supervisor User',
    });

    mockAuthorizationService.authorizeUserQuery.mockResolvedValue(undefined);
    mockDomainService.getSupervisorByIdentifier.mockResolvedValue(mockResponse);

    const result = await service.getSupervisorByIdentifier(callerId, request);

    expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
    expect(mockDomainService.getSupervisorByIdentifier).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when authorization fails', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorByIdentifierRequest('supervisor@example.com');

    mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Unauthorized'));

    await expect(service.getSupervisorByIdentifier(callerId, request)).rejects.toThrow('Unauthorized');
    expect(mockDomainService.getSupervisorByIdentifier).not.toHaveBeenCalled();
  });
});

