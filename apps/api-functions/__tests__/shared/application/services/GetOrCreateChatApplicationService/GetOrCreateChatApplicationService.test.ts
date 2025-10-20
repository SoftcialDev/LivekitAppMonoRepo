/**
 * @fileoverview GetOrCreateChatApplicationService - unit tests
 * @summary Tests for GetOrCreateChatApplicationService functionality
 * @description Validates chat creation operations, authorization, and business logic
 */

import { GetOrCreateChatApplicationService } from '../../../../../shared/application/services/GetOrCreateChatApplicationService';
import { GetOrCreateChatRequest } from '../../../../../shared/domain/value-objects/GetOrCreateChatRequest';
import { GetOrCreateChatResponse } from '../../../../../shared/domain/value-objects/GetOrCreateChatResponse';
import { GetOrCreateChatDomainService } from '../../../../../shared/domain/services/GetOrCreateChatDomainService';
import { AuthorizationService } from '../../../../../shared/domain/services/AuthorizationService';

// Mock dependencies
const mockGetOrCreateChatDomainService: jest.Mocked<GetOrCreateChatDomainService> = {
  getOrCreateChat: jest.fn()
} as any;

const mockAuthorizationService: jest.Mocked<AuthorizationService> = {
  authorizeUserQuery: jest.fn(),
  canAccessAdmin: jest.fn(),
  canManageUsers: jest.fn(),
  canManageSupervisors: jest.fn(),
  canAccessUserData: jest.fn(),
  canManageContactManagers: jest.fn(),
  canManageSuperAdmins: jest.fn(),
  canDeleteUsers: jest.fn(),
  canChangeUserRoles: jest.fn(),
  canChangeSupervisors: jest.fn()
} as any;

describe('GetOrCreateChatApplicationService', () => {
  let service: GetOrCreateChatApplicationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GetOrCreateChatApplicationService(
      mockGetOrCreateChatDomainService,
      mockAuthorizationService
    );
  });

  describe('constructor', () => {
    it('should create service with dependencies', () => {
      expect(service).toBeInstanceOf(GetOrCreateChatApplicationService);
    });
  });

  describe('getOrCreateChat', () => {
    it('should create or get chat when user is authorized', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      const expectedResponse = new GetOrCreateChatResponse('chat-123');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockResolvedValue(expectedResponse);

      const result = await service.getOrCreateChat(callerId, request, token);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).toHaveBeenCalledWith(request, token);
      expect(result).toBe(expectedResponse);
    });

    it('should return existing chat when chat already exists', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      const expectedResponse = new GetOrCreateChatResponse('existing-chat-456');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockResolvedValue(expectedResponse);

      const result = await service.getOrCreateChat(callerId, request, token);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).toHaveBeenCalledWith(request, token);
      expect(result).toBe(expectedResponse);
    });

    it('should throw error when user is not authorized', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('User not authorized'));

      await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('User not authorized');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).not.toHaveBeenCalled();
    });

    it('should handle domain service errors', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockRejectedValue(new Error('Chat service unavailable'));

      await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('Chat service unavailable');

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).toHaveBeenCalledWith(request, token);
    });

    it('should handle request with minimal parameters', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      const expectedResponse = new GetOrCreateChatResponse('chat-789');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockResolvedValue(expectedResponse);

      const result = await service.getOrCreateChat(callerId, request, token);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).toHaveBeenCalledWith(request, token);
      expect(result).toBe(expectedResponse);
    });

    it('should handle request with all parameters', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      const expectedResponse = new GetOrCreateChatResponse('chat-456');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockResolvedValue(expectedResponse);

      const result = await service.getOrCreateChat(callerId, request, token);

      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledWith(callerId);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).toHaveBeenCalledWith(request, token);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should propagate authorization errors', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      mockAuthorizationService.authorizeUserQuery.mockRejectedValue(new Error('Invalid token'));

      await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('Invalid token');
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid request parameters', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'invalid-email');
      const token = 'auth-token-123';

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockRejectedValue(new Error('Invalid email format'));

      await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('Invalid email format');
    });
  });

  describe('edge cases', () => {
    it('should handle empty token', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = '';

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockRejectedValue(new Error('Invalid token'));

      await expect(service.getOrCreateChat(callerId, request, token)).rejects.toThrow('Invalid token');
    });

    it('should handle concurrent chat creation requests', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      const expectedResponse = new GetOrCreateChatResponse('chat-concurrent-123');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockResolvedValue(expectedResponse);

      // Simulate concurrent requests
      const promises = [
        service.getOrCreateChat(callerId, request, token),
        service.getOrCreateChat(callerId, request, token),
        service.getOrCreateChat(callerId, request, token)
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAuthorizationService.authorizeUserQuery).toHaveBeenCalledTimes(3);
      expect(mockGetOrCreateChatDomainService.getOrCreateChat).toHaveBeenCalledTimes(3);
    });

    it('should handle long-running chat creation', async () => {
      const callerId = 'user-123';
      const request = new GetOrCreateChatRequest(callerId, 'pso@example.com');
      const token = 'auth-token-123';

      const expectedResponse = new GetOrCreateChatResponse('chat-long-running-123');

      mockAuthorizationService.authorizeUserQuery.mockResolvedValue();
      mockGetOrCreateChatDomainService.getOrCreateChat.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(expectedResponse), 100))
      );

      const startTime = Date.now();
      const result = await service.getOrCreateChat(callerId, request, token);
      const endTime = Date.now();

      expect(result).toBe(expectedResponse);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});
