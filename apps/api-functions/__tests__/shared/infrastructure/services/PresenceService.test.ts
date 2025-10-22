import { PresenceService } from '../../../../shared/infrastructure/services/PresenceService';
import { IUserRepository } from '../../../../shared/domain/interfaces/IUserRepository';
import { PresenceDomainService } from '../../../../shared/domain/services/PresenceDomainService';
import { IWebPubSubService } from '../../../../shared/domain/interfaces/IWebPubSubService';

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('PresenceService', () => {
  let presenceService: PresenceService;
  let mockUserRepository: Partial<jest.Mocked<IUserRepository>>;
  let mockPresenceDomainService: jest.Mocked<PresenceDomainService>;
  let mockWebPubSubService: jest.Mocked<IWebPubSubService>;

  beforeEach(() => {
    // Mock repositories and services
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAllUsers: jest.fn(),
      findByRoles: jest.fn(),
    };

    mockPresenceDomainService = {
      setUserOffline: jest.fn(),
      setUserOnline: jest.fn(),
      getUserStatus: jest.fn(),
      getAllOnlineUsers: jest.fn(),
      broadcastPresenceUpdate: jest.fn(),
    } as any;

    mockWebPubSubService = {
      generateToken: jest.fn(),
      broadcastPresence: jest.fn(),
      broadcastMessage: jest.fn(),
      listAllGroupsAndUsers: jest.fn(),
      getActiveUsersInPresenceGroup: jest.fn(),
      syncAllUsersWithDatabase: jest.fn(),
      debugSync: jest.fn(),
      broadcastSupervisorChangeNotification: jest.fn(),
      logActiveUsersInPresenceGroup: jest.fn(),
    };

    // Create service instance
    presenceService = new PresenceService(
      mockUserRepository as jest.Mocked<IUserRepository>,
      mockPresenceDomainService,
      mockWebPubSubService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
  });

  describe('constructor', () => {
    it('should create PresenceService instance', () => {
      expect(presenceService).toBeInstanceOf(PresenceService);
    });
  });

  describe('setUserOffline', () => {
    it('should set user offline successfully', async () => {
      const mockUser = {
        id: 'user-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'Employee' as any,
        roleChangedAt: null,
        supervisorId: null,
        assignedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        // Add all required properties from Prisma User model
        contactProfile: null,
        recordingSessionsSubjectOf: [],
        supervisor: null,
        employees: [],
        supervisorSnapshots: [],
        psoSnapshots: [],
        presence: null,
        presenceHistory: [],
        recordingSessions: [],
        commands: [],
        streamingSessions: [],
        auditLogs: [],
        chatParticipants: [],
        contactManagerForms: [],
        ContactManagerStatusHistory: [],
      } as any;

      mockUserRepository.findByEmail!.mockResolvedValue(mockUser);
      mockPresenceDomainService.setUserOffline.mockResolvedValue(undefined);

      await presenceService.setUserOffline('test@example.com');

      expect(mockUserRepository.findByEmail!).toHaveBeenCalledWith('test@example.com');
      expect(mockPresenceDomainService.setUserOffline).toHaveBeenCalledWith('user-123');
    });

    it('should handle user not found', async () => {
      mockUserRepository.findByEmail!.mockResolvedValue(null);

      await presenceService.setUserOffline('nonexistent@example.com');

      expect(mockUserRepository.findByEmail!).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockPresenceDomainService.setUserOffline).not.toHaveBeenCalled();
    });

    it('should handle domain service errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        azureAdObjectId: 'azure-obj-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'Employee' as any,
        roleChangedAt: null,
        supervisorId: null,
        assignedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        // Add all required properties from Prisma User model
        contactProfile: null,
        recordingSessionsSubjectOf: [],
        supervisor: null,
        employees: [],
        supervisorSnapshots: [],
        psoSnapshots: [],
        presence: null,
        presenceHistory: [],
        recordingSessions: [],
        commands: [],
        streamingSessions: [],
        auditLogs: [],
        chatParticipants: [],
        contactManagerForms: [],
        ContactManagerStatusHistory: [],
      } as any;

      mockUserRepository.findByEmail!.mockResolvedValue(mockUser);
      mockPresenceDomainService.setUserOffline.mockRejectedValue(new Error('Domain service error'));

      // Should not throw
      await expect(presenceService.setUserOffline('test@example.com')).resolves.toBeUndefined();

      expect(mockUserRepository.findByEmail!).toHaveBeenCalledWith('test@example.com');
      expect(mockPresenceDomainService.setUserOffline).toHaveBeenCalledWith('user-123');
    });

    it('should handle repository errors gracefully', async () => {
      mockUserRepository.findByEmail!.mockRejectedValue(new Error('Repository error'));

      // Should not throw
      await expect(presenceService.setUserOffline('test@example.com')).resolves.toBeUndefined();

      expect(mockUserRepository.findByEmail!).toHaveBeenCalledWith('test@example.com');
      expect(mockPresenceDomainService.setUserOffline).not.toHaveBeenCalled();
    });

    it('should handle different email formats', async () => {
      const testCases = [
        'user@example.com',
        'USER@EXAMPLE.COM',
        'user+tag@example.com',
        'user.name@example.com',
        'user123@subdomain.example.com',
      ];

      for (const email of testCases) {
        const mockUser = {
          id: `user-${email}`,
          azureAdObjectId: 'azure-obj-123',
          email,
          fullName: 'Test User',
          role: 'PSO' as any,
          roleChangedAt: null,
          supervisorId: null,
          assignedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          // Add all required properties from Prisma User model
          contactProfile: null,
          recordingSessionsSubjectOf: [],
          supervisor: null,
          employees: [],
          supervisorSnapshots: [],
          psoSnapshots: [],
          presence: null,
          presenceHistory: [],
          recordingSessions: [],
          commands: [],
          streamingSessions: [],
          auditLogs: [],
          chatParticipants: [],
          contactManagerForms: [],
          ContactManagerStatusHistory: [],
        } as any;

        mockUserRepository.findByEmail!.mockResolvedValue(mockUser);
        mockPresenceDomainService.setUserOffline.mockResolvedValue(undefined);

        await presenceService.setUserOffline(email);

        expect(mockUserRepository.findByEmail!).toHaveBeenCalledWith(email);
        expect(mockPresenceDomainService.setUserOffline).toHaveBeenCalledWith(`user-${email}`);
      }
    });

    it('should handle empty email', async () => {
      mockUserRepository.findByEmail!.mockResolvedValue(null);

      await presenceService.setUserOffline('');

      expect(mockUserRepository.findByEmail!).toHaveBeenCalledWith('');
      expect(mockPresenceDomainService.setUserOffline).not.toHaveBeenCalled();
    });
  });
});
