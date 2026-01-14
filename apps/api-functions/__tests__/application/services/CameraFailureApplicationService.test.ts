import { CameraFailureApplicationService } from '../../../src/application/services/CameraFailureApplicationService';
import { ICameraStartFailureRepository } from '../../../src/domain/interfaces/ICameraStartFailureRepository';
import { CameraStartFailureRequest } from '../../../src/domain/schemas/CameraStartFailureSchema';
import { AttemptResult } from '../../../src/domain/enums/AttemptResult';
import { CameraFailureStage } from '@prisma/client';

describe('CameraFailureApplicationService', () => {
  let service: CameraFailureApplicationService;
  let mockRepository: jest.Mocked<ICameraStartFailureRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
    } as any;

    service = new CameraFailureApplicationService(mockRepository);
  });

  it('should successfully log camera start failure with all fields', async () => {
    const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
      stage: 'Permission',
      userAdId: 'test-user-id',
      userEmail: 'test@example.com',
      attempts: [
        {
          result: AttemptResult.Other,
        },
      ],
    };

    mockRepository.create.mockResolvedValue(undefined);

    await service.logStartFailure(input);

    expect(mockRepository.create).toHaveBeenCalled();
    const createCall = mockRepository.create.mock.calls[0][0];
    expect(createCall).toHaveProperty('stage', 'Permission');
    expect(createCall).toHaveProperty('userAdId', 'test-user-id');
  });

  it('should successfully log camera start failure without userEmail', async () => {
    const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
      stage: CameraFailureStage.Enumerate,
      userAdId: 'test-user-id',
    };

    mockRepository.create.mockResolvedValue(undefined);

    await service.logStartFailure(input);

    expect(mockRepository.create).toHaveBeenCalled();
  });

    it('should handle different stages', async () => {
      const stages = [CameraFailureStage.Permission, CameraFailureStage.Enumerate, CameraFailureStage.TrackCreate];
      
      for (const stage of stages) {
        const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
          stage,
          userAdId: 'test-user-id',
          userEmail: 'test@example.com',
        };

        mockRepository.create.mockResolvedValue(undefined);

        await service.logStartFailure(input);

        expect(mockRepository.create).toHaveBeenCalled();
        mockRepository.create.mockClear();
      }
    });

  it('should handle error when repository create fails', async () => {
    const input: CameraStartFailureRequest & { userAdId: string; userEmail?: string } = {
      stage: 'Permission',
      userAdId: 'test-user-id',
      userEmail: 'test@example.com',
    };

    mockRepository.create.mockRejectedValue(new Error('Database error'));

    await expect(service.logStartFailure(input)).rejects.toThrow('Database error');
  });
});

