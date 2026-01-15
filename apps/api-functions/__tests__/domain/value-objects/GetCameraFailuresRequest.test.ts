import { GetCameraFailuresRequest } from '../../../src/domain/value-objects/GetCameraFailuresRequest';
import { CameraFailureStage } from '@prisma/client';

describe('GetCameraFailuresRequest', () => {
  describe('fromQuery', () => {
    it('should create request with userEmail parameter', () => {
      const query = { userEmail: 'user@example.com' };
      const request = GetCameraFailuresRequest.fromQuery(query);

      expect(request.userEmail).toBe('user@example.com');
    });

    it('should create request with userAdId parameter', () => {
      const query = { userAdId: 'ad-id-123' };
      const request = GetCameraFailuresRequest.fromQuery(query);

      expect(request.userAdId).toBe('ad-id-123');
    });

    it('should create request with startDate parameter', () => {
      const query = { startDate: '2024-01-01T10:00:00Z' };
      const request = GetCameraFailuresRequest.fromQuery(query);

      expect(request.startDate).toBeInstanceOf(Date);
    });

    it('should create request with endDate parameter', () => {
      const query = { endDate: '2024-01-01T11:00:00Z' };
      const request = GetCameraFailuresRequest.fromQuery(query);

      expect(request.endDate).toBeInstanceOf(Date);
    });

    it('should create request with all parameters', () => {
      const query = {
        stage: CameraFailureStage.Permission,
        userEmail: 'user@example.com',
        userAdId: 'ad-id',
        startDate: '2024-01-01T10:00:00Z',
        endDate: '2024-01-01T11:00:00Z',
        limit: '10',
        offset: '0'
      };
      const request = GetCameraFailuresRequest.fromQuery(query);

      expect(request.stage).toBe(CameraFailureStage.Permission);
      expect(request.userEmail).toBe('user@example.com');
      expect(request.userAdId).toBe('ad-id');
      expect(request.startDate).toBeInstanceOf(Date);
      expect(request.endDate).toBeInstanceOf(Date);
      expect(request.limit).toBe(10);
      expect(request.offset).toBe(0);
    });
  });
});

