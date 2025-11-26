/**
 * @fileoverview Tests for DeleteErrorLogsApplicationService
 * @description Tests for error log deletion application service
 */

import { DeleteErrorLogsApplicationService } from '../../../../shared/application/services/DeleteErrorLogsApplicationService';
import { DeleteErrorLogsDomainService } from '../../../../shared/domain/services/DeleteErrorLogsDomainService';
import { AuthError } from '../../../../shared/domain/errors/DomainError';

describe('DeleteErrorLogsApplicationService', () => {
  let service: DeleteErrorLogsApplicationService;
  let deleteErrorLogsDomainService: jest.Mocked<DeleteErrorLogsDomainService>;

  beforeEach(() => {
    jest.clearAllMocks();
    deleteErrorLogsDomainService = {
      deleteErrorLog: jest.fn(),
      deleteErrorLogs: jest.fn()
    } as any;

    service = new DeleteErrorLogsApplicationService(deleteErrorLogsDomainService);
  });

  describe('deleteErrorLogs', () => {
    it('should delete error logs for authorized user', async () => {
      deleteErrorLogsDomainService.deleteErrorLogs.mockResolvedValue();

      await service.deleteErrorLogs('shanty.cerdas@example.com', ['error-123', 'error-456']);

      expect(deleteErrorLogsDomainService.deleteErrorLogs).toHaveBeenCalledWith([
        'error-123',
        'error-456'
      ]);
    });

    it('should delete single error log for authorized user', async () => {
      deleteErrorLogsDomainService.deleteErrorLogs.mockResolvedValue();

      await service.deleteErrorLogs('shanty.cerdas@example.com', ['error-123']);

      expect(deleteErrorLogsDomainService.deleteErrorLogs).toHaveBeenCalledWith(['error-123']);
    });

    it('should throw AuthError for unauthorized user', async () => {
      await expect(
        service.deleteErrorLogs('unauthorized@example.com', ['error-123'])
      ).rejects.toThrow(AuthError);

      await expect(
        service.deleteErrorLogs('unauthorized@example.com', ['error-123'])
      ).rejects.toThrow('Access denied: Only authorized user can delete error logs');
    });

    it('should throw AuthError for empty email', async () => {
      await expect(service.deleteErrorLogs('', ['error-123'])).rejects.toThrow(AuthError);
    });

    it('should handle domain service errors', async () => {
      deleteErrorLogsDomainService.deleteErrorLogs.mockRejectedValue(
        new Error('Domain service error')
      );

      await expect(service.deleteErrorLogs('shanty.cerdas@example.com', ['error-123'])).rejects.toThrow(
        'Domain service error'
      );
    });
  });
});

