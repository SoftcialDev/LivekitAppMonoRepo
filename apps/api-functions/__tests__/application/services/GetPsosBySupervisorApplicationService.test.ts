import { GetPsosBySupervisorApplicationService } from '../../../src/application/services/GetPsosBySupervisorApplicationService';
import { GetPsosBySupervisorDomainService } from '../../../src/domain/services/GetPsosBySupervisorDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { GetPsosBySupervisorRequest } from '../../../src/domain/value-objects/GetPsosBySupervisorRequest';
import { GetPsosBySupervisorResponse } from '../../../src/domain/value-objects/GetPsosBySupervisorResponse';
import { UserRole } from '@prisma/client';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { InsufficientPrivilegesError } from '../../../src/domain/errors/MiddlewareErrors';

describe('GetPsosBySupervisorApplicationService', () => {
  let service: GetPsosBySupervisorApplicationService;
  let mockDomainService: jest.Mocked<GetPsosBySupervisorDomainService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockDomainService = {
      getPsosBySupervisor: jest.fn(),
    } as any;

    mockUserRepository = {
      findByAzureAdObjectId: jest.fn(),
    } as any;

    service = new GetPsosBySupervisorApplicationService(
      mockDomainService,
      mockUserRepository
    );
  });

  it('should throw error when caller is not found', async () => {
    const callerId = 'test-caller-id';
    const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-id');

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

    await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow(UserNotFoundError);
  });

  it('should return PSOs for supervisor when caller is supervisor and no supervisorId provided', async () => {
    const callerId = 'test-caller-id';
    const request = new GetPsosBySupervisorRequest(callerId, undefined);
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Supervisor,
    };
    const mockResponse = new GetPsosBySupervisorResponse([]);

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
    mockDomainService.getPsosBySupervisor.mockResolvedValue(mockResponse);

    const result = await service.getPsosBySupervisor(callerId, request);

    expect(mockDomainService.getPsosBySupervisor).toHaveBeenCalledWith(
      expect.objectContaining({ supervisorId: 'caller-id' })
    );
    expect(result).toBe(mockResponse);
  });

  it('should return PSOs for supervisor when caller is supervisor and supervisorId matches caller', async () => {
    const callerId = 'test-caller-id';
    const request = new GetPsosBySupervisorRequest(callerId, 'caller-id');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Supervisor,
    };
    const mockResponse = new GetPsosBySupervisorResponse([]);

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
    mockDomainService.getPsosBySupervisor.mockResolvedValue(mockResponse);

    const result = await service.getPsosBySupervisor(callerId, request);

    expect(mockDomainService.getPsosBySupervisor).toHaveBeenCalledWith(
      expect.objectContaining({ supervisorId: 'caller-id' })
    );
    expect(result).toBe(mockResponse);
  });

  it('should return PSOs for other supervisor when caller is supervisor', async () => {
    const callerId = 'test-caller-id';
    const request = new GetPsosBySupervisorRequest(callerId, 'other-supervisor-id');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Supervisor,
    };
    const mockResponse = new GetPsosBySupervisorResponse([]);

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
    mockDomainService.getPsosBySupervisor.mockResolvedValue(mockResponse);

    const result = await service.getPsosBySupervisor(callerId, request);

    expect(mockDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should return PSOs for admin', async () => {
    const callerId = 'test-caller-id';
    const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-id');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.Admin,
    };
    const mockResponse = new GetPsosBySupervisorResponse([]);

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);
    mockDomainService.getPsosBySupervisor.mockResolvedValue(mockResponse);

    const result = await service.getPsosBySupervisor(callerId, request);

    expect(mockDomainService.getPsosBySupervisor).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it('should throw error when caller has insufficient privileges', async () => {
    const callerId = 'test-caller-id';
    const request = new GetPsosBySupervisorRequest(callerId, 'supervisor-id');
    const mockCaller = {
      id: 'caller-id',
      azureAdObjectId: callerId,
      role: UserRole.PSO,
    };

    mockUserRepository.findByAzureAdObjectId.mockResolvedValue(mockCaller as any);

    await expect(service.getPsosBySupervisor(callerId, request)).rejects.toThrow(InsufficientPrivilegesError);
  });
});

