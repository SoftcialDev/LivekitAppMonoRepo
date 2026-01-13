import { AuditService } from '../../../src/infrastructure/services/AuditService';
import { IAuditRepository } from '../../../src/domain/interfaces/IAuditRepository';
import { AuditLog } from '../../../src/domain/entities/AuditLog';
import { getCentralAmericaTime } from '../../../src/utils/dateUtils';
import { mockDate } from '../../shared/mocks';

jest.mock('../../../src/utils/dateUtils');

const mockGetCentralAmericaTime = getCentralAmericaTime as jest.MockedFunction<typeof getCentralAmericaTime>;

const createMockAuditLog = (overrides = {}): AuditLog => {
  return new AuditLog({
    id: 'audit-log-id',
    entity: 'User',
    entityId: 'user-id',
    action: 'CREATE',
    changedById: 'admin-id',
    timestamp: mockDate,
    dataBefore: null,
    dataAfter: null,
    ...overrides,
  });
};

describe('AuditService', () => {
  let auditRepository: jest.Mocked<IAuditRepository>;
  let service: AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCentralAmericaTime.mockReturnValue(mockDate);
    
    auditRepository = {
      create: jest.fn<Promise<AuditLog>, [AuditLog]>(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
      findByDateRange: jest.fn(),
    } as jest.Mocked<IAuditRepository>;

    service = new AuditService(auditRepository);
  });

  describe('logAudit', () => {
    it('should create and log an audit entry', async () => {
      const entry = {
        entity: 'User',
        entityId: 'user-id',
        action: 'CREATE',
        changedById: 'admin-id',
        dataBefore: { name: 'Old Name' },
        dataAfter: { name: 'New Name' },
      };

      auditRepository.create.mockResolvedValue(createMockAuditLog());

      await service.logAudit(entry);

      expect(mockGetCentralAmericaTime).toHaveBeenCalled();
      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.any(AuditLog)
      );
      
      const auditLog = (auditRepository.create as jest.Mock).mock.calls[0][0];
      expect(auditLog).toBeInstanceOf(AuditLog);
      expect(auditLog.entity).toBe('User');
      expect(auditLog.entityId).toBe('user-id');
      expect(auditLog.action).toBe('CREATE');
      expect(auditLog.changedById).toBe('admin-id');
      expect(auditLog.dataBefore).toEqual({ name: 'Old Name' });
      expect(auditLog.dataAfter).toEqual({ name: 'New Name' });
      expect(auditLog.timestamp).toBe(mockDate);
    });

    it('should handle audit entries without dataBefore and dataAfter', async () => {
      const entry = {
        entity: 'Role',
        entityId: 'role-id',
        action: 'UPDATE',
        changedById: 'admin-id',
      };

      auditRepository.create.mockResolvedValue(createMockAuditLog());

      await service.logAudit(entry);

      const auditLog = (auditRepository.create as jest.Mock).mock.calls[0][0];
      expect(auditLog.dataBefore).toBeNull();
      expect(auditLog.dataAfter).toBeNull();
    });

    it('should silently handle audit repository errors', async () => {
      const entry = {
        entity: 'User',
        entityId: 'user-id',
        action: 'DELETE',
        changedById: 'admin-id',
      };

      const error = new Error('Database error');
      auditRepository.create.mockRejectedValue(error);

      await expect(service.logAudit(entry)).resolves.not.toThrow();
    });

    it('should generate a unique ID for each audit log', async () => {
      const entry = {
        entity: 'User',
        entityId: 'user-id',
        action: 'CREATE',
        changedById: 'admin-id',
      };

      auditRepository.create.mockResolvedValue(createMockAuditLog());

      await service.logAudit(entry);
      await service.logAudit(entry);

      const firstCall = (auditRepository.create as jest.Mock).mock.calls[0][0];
      const secondCall = (auditRepository.create as jest.Mock).mock.calls[1][0];
      
      expect(firstCall.id).toBeDefined();
      expect(secondCall.id).toBeDefined();
      expect(firstCall.id).not.toBe(secondCall.id);
    });
  });
});

