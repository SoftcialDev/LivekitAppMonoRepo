/**
 * @fileoverview Tests for AuditService
 * @description Tests for audit logging operations
 */

import { AuditService } from '../../../../shared/infrastructure/services/AuditService';
import { IAuditRepository } from '../../../../shared/domain/interfaces/IAuditRepository';
import { AuditLog } from '../../../../shared/domain/entities/AuditLog';

// Mock dependencies
jest.mock('../../../../shared/utils/dateUtils', () => ({
  getCentralAmericaTime: jest.fn().mockReturnValue(new Date('2025-01-15T10:30:00Z')),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('test-uuid-123'),
}));

describe('AuditService', () => {
  let auditService: AuditService;
  let mockAuditRepository: jest.Mocked<IAuditRepository>;

  beforeEach(() => {
    mockAuditRepository = {
      create: jest.fn(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
      findByDateRange: jest.fn(),
    };

    auditService = new AuditService(mockAuditRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create AuditService with repository', () => {
      expect(auditService).toBeInstanceOf(AuditService);
    });
  });

  describe('logAudit', () => {
    const mockAuditEntry = {
      entity: 'User',
      entityId: 'user-123',
      action: 'UPDATE',
      changedById: 'admin-456',
      dataBefore: { role: 'PSO' },
      dataAfter: { role: 'SUPERVISOR' },
    };

    it('should log audit entry successfully', async () => {
      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));

      await auditService.logAudit(mockAuditEntry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'User',
          entityId: 'user-123',
          action: 'UPDATE',
          changedById: 'admin-456',
          dataBefore: { role: 'PSO' },
          dataAfter: { role: 'SUPERVISOR' },
        })
      );
    });

    it('should log audit entry without optional data', async () => {
      const entryWithoutData = {
        entity: 'User',
        entityId: 'user-123',
        action: 'CREATE',
        changedById: 'admin-456',
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));

      await auditService.logAudit(entryWithoutData);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'User',
          entityId: 'user-123',
          action: 'CREATE',
          changedById: 'admin-456',
          dataBefore: null,
          dataAfter: null,
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      const repositoryError = new Error('Database connection failed');
      mockAuditRepository.create.mockRejectedValue(repositoryError);

      // Should not throw
      await expect(auditService.logAudit(mockAuditEntry)).resolves.toBeUndefined();

      expect(mockAuditRepository.create).toHaveBeenCalled();
    });

    it('should log different entity types', async () => {
      const entities = ['User', 'Recording', 'Session', 'Command', 'Snapshot'];
      
      for (const entity of entities) {
        const entry = {
          entity,
          entityId: `${entity.toLowerCase()}-123`,
          action: 'CREATE',
          changedById: 'admin-456',
        };

        mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
        await auditService.logAudit(entry);

        expect(mockAuditRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            entity,
            entityId: `${entity.toLowerCase()}-123`,
            action: 'CREATE',
            changedById: 'admin-456',
          })
        );
      }
    });

    it('should log different action types', async () => {
      const actions = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'EXPORT'];
      
      for (const action of actions) {
        const entry = {
          entity: 'User',
          entityId: 'user-123',
          action,
          changedById: 'admin-456',
        };

        mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
        await auditService.logAudit(entry);

        expect(mockAuditRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            action,
          })
        );
      }
    });

    it('should handle complex data objects', async () => {
      const complexDataBefore = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'PSO',
          permissions: ['read', 'write'],
        },
        metadata: {
          created: '2025-01-01T00:00:00Z',
          version: 1,
        },
      };

      const complexDataAfter = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'SUPERVISOR',
          permissions: ['read', 'write', 'admin'],
        },
        metadata: {
          created: '2025-01-01T00:00:00Z',
          version: 2,
          updated: '2025-01-15T10:30:00Z',
        },
      };

      const entry = {
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        dataBefore: complexDataBefore,
        dataAfter: complexDataAfter,
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dataBefore: complexDataBefore,
          dataAfter: complexDataAfter,
        })
      );
    });

    it('should handle null and undefined data', async () => {
      const entryWithNulls = {
        entity: 'User',
        entityId: 'user-123',
        action: 'DELETE',
        changedById: 'admin-456',
        dataBefore: null,
        dataAfter: undefined,
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entryWithNulls);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'User',
          entityId: 'user-123',
          action: 'DELETE',
          changedById: 'admin-456',
          dataBefore: null,
          dataAfter: null,
        })
      );
    });

    it('should handle empty strings and special characters', async () => {
      const entry = {
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        dataBefore: { name: '' },
        dataAfter: { name: 'José María' },
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dataBefore: { name: '' },
          dataAfter: { name: 'José María' },
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very long entity names', async () => {
      const longEntityName = 'A'.repeat(1000);
      const entry = {
        entity: longEntityName,
        entityId: 'id-123',
        action: 'CREATE',
        changedById: 'admin-456',
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: longEntityName,
        })
      );
    });

    it('should handle very long entity IDs', async () => {
      const longEntityId = 'B'.repeat(1000);
      const entry = {
        entity: 'User',
        entityId: longEntityId,
        action: 'CREATE',
        changedById: 'admin-456',
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: longEntityId,
        })
      );
    });

    it('should handle special characters in IDs', async () => {
      const entry = {
        entity: 'User',
        entityId: 'user-123@domain.com#special',
        action: 'CREATE',
        changedById: 'admin-456',
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'user-123@domain.com#special',
        })
      );
    });

    it('should handle unicode characters', async () => {
      const entry = {
        entity: '用户',
        entityId: '用户-123',
        action: '创建',
        changedById: '管理员-456',
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: '用户',
          entityId: '用户-123',
          action: '创建',
          changedById: '管理员-456',
        })
      );
    });
  });

  describe('validation scenarios', () => {
    it('should handle user role change scenario', async () => {
      const entry = {
        entity: 'User',
        entityId: 'pso-123',
        action: 'UPDATE',
        changedById: 'supervisor-456',
        dataBefore: { role: 'PSO', permissions: ['read'] },
        dataAfter: { role: 'SUPERVISOR', permissions: ['read', 'write', 'admin'] },
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'User',
          entityId: 'pso-123',
          action: 'UPDATE',
          changedById: 'supervisor-456',
          dataBefore: { role: 'PSO', permissions: ['read'] },
          dataAfter: { role: 'SUPERVISOR', permissions: ['read', 'write', 'admin'] },
        })
      );
    });

    it('should handle recording deletion scenario', async () => {
      const entry = {
        entity: 'Recording',
        entityId: 'recording-789',
        action: 'DELETE',
        changedById: 'admin-456',
        dataBefore: {
          sessionId: 'session-123',
          duration: 3600,
          filePath: '/recordings/session-123.mp4',
        },
        dataAfter: null,
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));
      await auditService.logAudit(entry);

      expect(mockAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'Recording',
          entityId: 'recording-789',
          action: 'DELETE',
          changedById: 'admin-456',
          dataBefore: {
            sessionId: 'session-123',
            duration: 3600,
            filePath: '/recordings/session-123.mp4',
          },
          dataAfter: null,
        })
      );
    });

    it('should handle bulk operations scenario', async () => {
      const entries = [
        {
          entity: 'User',
          entityId: 'user-1',
          action: 'CREATE',
          changedById: 'admin-456',
        },
        {
          entity: 'User',
          entityId: 'user-2',
          action: 'CREATE',
          changedById: 'admin-456',
        },
        {
          entity: 'User',
          entityId: 'user-3',
          action: 'CREATE',
          changedById: 'admin-456',
        },
      ];

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));

      for (const entry of entries) {
        await auditService.logAudit(entry);
      }

      expect(mockAuditRepository.create).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent audit logging', async () => {
      const entry = {
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
      };

      mockAuditRepository.create.mockResolvedValue(new AuditLog({
        id: 'test-uuid-123',
        entity: 'User',
        entityId: 'user-123',
        action: 'UPDATE',
        changedById: 'admin-456',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        dataBefore: { role: 'PSO' },
        dataAfter: { role: 'SUPERVISOR' },
      }));

      // Simulate concurrent calls
      const promises = Array(5).fill(null).map(() => auditService.logAudit(entry));
      await Promise.all(promises);

      expect(mockAuditRepository.create).toHaveBeenCalledTimes(5);
    });
  });
});
