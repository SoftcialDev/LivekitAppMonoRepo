import { GetSupervisorForPsoApplicationService } from '../../../src/application/services/GetSupervisorForPsoApplicationService';
import { GetSupervisorForPsoDomainService } from '../../../src/domain/services/GetSupervisorForPsoDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetSupervisorForPsoRequest } from '../../../src/domain/value-objects/GetSupervisorForPsoRequest';
import { GetSupervisorForPsoResponse } from '../../../src/domain/value-objects/GetSupervisorForPsoResponse';
import { UserRole } from '@prisma/client';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { InsufficientPrivilegesError } from '../../../src/domain/errors';

describe('GetSupervisorForPsoApplicationService', () => {
  let service: GetSupervisorForPsoApplicationService;
  let mockDomainService: jest.Mocked<GetSupervisorForPsoDomainService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockDomainService = {
      getSupervisorForPso: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as any;

    service = new GetSupervisorForPsoApplicationService(
      mockDomainService,
      mockUserRepository
    );
  });

  it('should throw error when caller is not found', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('pso@example.com');

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

    await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow(UserNotFoundError);
  });

  it('should allow PSO to query their own supervisor', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest(callerId);
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      email: 'pso@example.com',
      role: UserRole.PSO,
    };
    const mockResponse = new GetSupervisorForPsoResponse(undefined);

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
    mockDomainService.getSupervisorForPso.mockResolvedValue(mockResponse);

    const result = await service.getSupervisorForPso(callerId, request);

    expect(mockDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when PSO tries to query other PSO supervisor', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('other-pso@example.com');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      email: 'pso@example.com',
      role: UserRole.PSO,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);

    await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow(InsufficientPrivilegesError);
  });

  it('should allow supervisor to query supervisor for their assigned PSO', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('pso@example.com');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Supervisor,
    };
    const mockPso = {
      id: 'pso-id',
      azureAdObjectId: 'pso-azure-id',
      email: 'pso@example.com',
      supervisorId: 'caller-id',
    };
    const mockResponse = new GetSupervisorForPsoResponse(undefined);

    mockUserRepository.findByAzureAdObjectId
      .mockResolvedValueOnce(mockCaller as any)
      .mockResolvedValueOnce(mockPso as any);
    mockDomainService.getSupervisorForPso.mockResolvedValue(mockResponse);

    const result = await service.getSupervisorForPso(callerId, request);

    expect(mockDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when supervisor tries to query supervisor for unassigned PSO', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('pso@example.com');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Supervisor,
    };
    const mockPso = {
      id: 'pso-id',
      azureAdObjectId: 'pso-azure-id',
      email: 'pso@example.com',
      supervisorId: 'other-supervisor-id',
    };

    mockUserRepository.findByAzureAdObjectId
      .mockResolvedValueOnce(mockCaller as any)
      .mockResolvedValueOnce(mockPso as any);

    await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow(InsufficientPrivilegesError);
  });

  it('should allow admin to query any supervisor', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('pso@example.com');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Admin,
    };
    const mockResponse = new GetSupervisorForPsoResponse(undefined);

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
    mockDomainService.getSupervisorForPso.mockResolvedValue(mockResponse);

    const result = await service.getSupervisorForPso(callerId, request);

    expect(mockDomainService.getSupervisorForPso).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when non-admin/supervisor tries to query', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('pso@example.com');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.PSO,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);

    await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow(InsufficientPrivilegesError);
  });

  it('should throw error when user with Unassigned role tries to query', async () => {
    const callerId = 'test-caller-id';
    const request = new GetSupervisorForPsoRequest('pso@example.com');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Unassigned,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);

    await expect(service.getSupervisorForPso(callerId, request)).rejects.toThrow(InsufficientPrivilegesError);
  });
});

