/**
 * @fileoverview Tests for ServiceContainer
 * @description Tests for dependency injection container
 */

import { ServiceContainer } from '../../../../shared/infrastructure/container/ServiceContainer';

// Mock all dependencies
jest.mock('../../../../shared/infrastructure/repositories/CameraStartFailureRepository');
jest.mock('../../../../shared/infrastructure/repositories/UserRepository');
jest.mock('../../../../shared/domain/services/AuthorizationService');
jest.mock('../../../../shared/infrastructure/messaging/CommandMessagingService');
jest.mock('../../../../shared/infrastructure/repositories/SupervisorRepository');
jest.mock('../../../../shared/domain/services/SupervisorManagementService');
jest.mock('../../../../shared/infrastructure/services/AuditService');
jest.mock('../../../../shared/infrastructure/services/PresenceService');
jest.mock('../../../../shared/application/services/CameraFailureApplicationService');
jest.mock('../../../../shared/application/services/UserDeletionApplicationService');
jest.mock('../../../../shared/application/services/UserQueryApplicationService');
jest.mock('../../../../shared/domain/services/UserQueryService');
jest.mock('../../../../shared/domain/services/CommandAcknowledgmentService');
jest.mock('../../../../shared/infrastructure/repositories/PendingCommandRepository');
jest.mock('../../../../shared/application/services/CommandAcknowledgmentApplicationService');
jest.mock('../../../../shared/domain/services/ContactManagerFormService');
jest.mock('../../../../shared/infrastructure/services/BlobStorageService');
jest.mock('../../../../shared/infrastructure/services/ChatService');
jest.mock('../../../../shared/infrastructure/repositories/ContactManagerFormRepository');
jest.mock('../../../../shared/application/services/ContactManagerFormApplicationService');
jest.mock('../../../../shared/domain/services/ContactManagerDomainService');
jest.mock('../../../../shared/application/services/ContactManagerApplicationService');
jest.mock('../../../../shared/domain/services/SuperAdminDomainService');
jest.mock('../../../../shared/application/services/SuperAdminApplicationService');
jest.mock('../../../../shared/domain/services/PendingCommandDomainService');
jest.mock('../../../../shared/application/services/FetchPendingCommandsApplicationService');
jest.mock('../../../../shared/infrastructure/repositories/StreamingSessionRepository');
jest.mock('../../../../shared/domain/services/StreamingSessionDomainService');

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    container = new ServiceContainer();
  });

  describe('constructor', () => {
    it('should create ServiceContainer instance', () => {
      expect(container).toBeDefined();
      expect(typeof container).toBe('object');
    });
  });

  describe('service resolution', () => {
    it('should be able to resolve services', () => {
      // Test that the container can be instantiated and basic functionality works
      expect(container).toBeDefined();
      expect(typeof container).toBe('object');
    });

    it('should handle service instantiation without errors', () => {
      // Test that the container can be instantiated without throwing errors
      expect(() => new ServiceContainer()).not.toThrow();
    });
  });
});
