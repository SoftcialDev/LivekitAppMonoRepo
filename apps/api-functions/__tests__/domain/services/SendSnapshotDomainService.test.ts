import { SendSnapshotDomainService } from '../../../src/domain/services/SendSnapshotDomainService';
import { IUserRepository } from '../../../src/domain/interfaces/IUserRepository';
import { IBlobStorageService } from '../../../src/domain/interfaces/IBlobStorageService';
import { ISnapshotRepository } from '../../../src/domain/interfaces/ISnapshotRepository';
import { ISnapshotReasonRepository } from '../../../src/domain/interfaces/ISnapshotReasonRepository';
import { SendSnapshotRequest } from '../../../src/domain/value-objects/SendSnapshotRequest';
import { SendSnapshotResponse } from '../../../src/domain/value-objects/SendSnapshotResponse';
import { UserNotFoundError } from '../../../src/domain/errors/UserErrors';
import { SnapshotReasonNotFoundError, SnapshotReasonInactiveError, DescriptionRequiredError } from '../../../src/domain/errors/SnapshotErrors';
import { createMockUserRepository, createMockBlobStorageService, createMockSnapshotRepository, createMockSnapshotReasonRepository, createMockUser, createMockSupervisor } from './domainServiceTestSetup';

describe('SendSnapshotDomainService', () => {
  let service: SendSnapshotDomainService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockBlobStorageService: jest.Mocked<IBlobStorageService>;
  let mockSnapshotRepository: jest.Mocked<ISnapshotRepository>;
  let mockSnapshotReasonRepository: jest.Mocked<ISnapshotReasonRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockBlobStorageService = createMockBlobStorageService();
    mockSnapshotRepository = createMockSnapshotRepository();
    mockSnapshotReasonRepository = createMockSnapshotReasonRepository();
    service = new SendSnapshotDomainService(
      mockUserRepository,
      mockBlobStorageService,
      mockSnapshotRepository,
      mockSnapshotReasonRepository
    );
  });

  describe('sendSnapshot', () => {
    it('should send snapshot successfully', async () => {
      const request = new SendSnapshotRequest(
        'caller-id',
        'pso@example.com',
        'reason-id',
        'Test description',
        'base64image'
      );
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
        fullName: 'PSO User',
      });
      const reason = {
        id: 'reason-id',
        code: 'REASON_CODE',
        isActive: true,
      };
      const imageUrl = 'https://storage.example.com/image.jpg';

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockSnapshotReasonRepository.findById.mockResolvedValue(reason as any);
      mockBlobStorageService.uploadImage.mockResolvedValue(imageUrl);
      mockSnapshotRepository.create.mockResolvedValue({ id: 'snapshot-id' });

      const result = await service.sendSnapshot(request);

      expect(mockBlobStorageService.uploadImage).toHaveBeenCalled();
      expect(mockSnapshotRepository.create).toHaveBeenCalled();
      expect(result.snapshotId).toBe('snapshot-id');
      expect(result.message).toContain('sent successfully');
    });

    it('should throw error when supervisor not found', async () => {
      const request = new SendSnapshotRequest('caller-id', 'pso@example.com', 'reason-id', undefined, 'base64image');

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(null);

      await expect(service.sendSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when PSO not found', async () => {
      const request = new SendSnapshotRequest('caller-id', 'pso@example.com', 'reason-id', undefined, 'base64image');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.sendSnapshot(request)).rejects.toThrow(UserNotFoundError);
    });

    it('should throw error when snapshot reason not found', async () => {
      const request = new SendSnapshotRequest('caller-id', 'pso@example.com', 'reason-id', undefined, 'base64image');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockSnapshotReasonRepository.findById.mockResolvedValue(null);

      await expect(service.sendSnapshot(request)).rejects.toThrow(SnapshotReasonNotFoundError);
    });

    it('should throw error when snapshot reason is inactive', async () => {
      const request = new SendSnapshotRequest('caller-id', 'pso@example.com', 'reason-id', undefined, 'base64image');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const reason = {
        id: 'reason-id',
        code: 'REASON_CODE',
        isActive: false,
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockSnapshotReasonRepository.findById.mockResolvedValue(reason as any);

      await expect(service.sendSnapshot(request)).rejects.toThrow(SnapshotReasonInactiveError);
    });

    it('should throw error when OTHER reason has no description', async () => {
      const request = new SendSnapshotRequest('caller-id', 'pso@example.com', 'reason-id', undefined, 'base64image');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const reason = {
        id: 'reason-id',
        code: 'OTHER',
        isActive: true,
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockSnapshotReasonRepository.findById.mockResolvedValue(reason as any);

      await expect(service.sendSnapshot(request)).rejects.toThrow(DescriptionRequiredError);
    });

    it('should normalize PSO email to lowercase', async () => {
      const request = new SendSnapshotRequest('caller-id', 'PSO@EXAMPLE.COM', 'reason-id', 'Description', 'base64image');
      const supervisor = createMockSupervisor({
        id: 'supervisor-id',
        azureAdObjectId: 'caller-id',
      });
      const pso = createMockUser({
        id: 'pso-id',
        email: 'pso@example.com',
      });
      const reason = {
        id: 'reason-id',
        code: 'REASON_CODE',
        isActive: true,
      };

      mockUserRepository.findByAzureAdObjectId.mockResolvedValue(supervisor);
      mockUserRepository.findByEmail.mockResolvedValue(pso);
      mockSnapshotReasonRepository.findById.mockResolvedValue(reason as any);
      mockBlobStorageService.uploadImage.mockResolvedValue('https://storage.example.com/image.jpg');
      mockSnapshotRepository.create.mockResolvedValue({ id: 'snapshot-id' });

      await service.sendSnapshot(request);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('pso@example.com');
    });
  });
});





