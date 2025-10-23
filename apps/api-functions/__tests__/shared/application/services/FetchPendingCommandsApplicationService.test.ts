/**
 * @fileoverview Tests for FetchPendingCommandsApplicationService
 * @description Tests for fetch pending commands application service
 */

import { FetchPendingCommandsApplicationService } from '../../../../shared/application/services/FetchPendingCommandsApplicationService';
import { IPendingCommandDomainService } from '../../../../shared/domain/interfaces/IPendingCommandDomainService';
import { AuthorizationService } from '../../../../shared/domain/services/AuthorizationService';
import { FetchPendingCommandsResponse } from '../../../../shared/domain/value-objects/FetchPendingCommandsResponse';
import { PendingCommandAccessDeniedError } from '../../../../shared/domain/errors/PendingCommandErrors';

// Mock dependencies
jest.mock('../../../../shared/domain/interfaces/IPendingCommandDomainService');
jest.mock('../../../../shared/domain/services/AuthorizationService');

describe('FetchPendingCommandsApplicationService', () => {
  let fetchPendingCommandsApplicationService: FetchPendingCommandsApplicationService;
  let mockPendingCommandDomainService: jest.Mocked<IPendingCommandDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPendingCommandDomainService = {
      fetchPendingCommands: jest.fn()
    } as any;

    mockAuthorizationService = {
      canAccessEmployee: jest.fn()
    } as any;

    fetchPendingCommandsApplicationService = new FetchPendingCommandsApplicationService(
      mockPendingCommandDomainService,
      mockAuthorizationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create FetchPendingCommandsApplicationService instance', () => {
      expect(fetchPendingCommandsApplicationService).toBeInstanceOf(FetchPendingCommandsApplicationService);
    });
  });

  describe('fetchPendingCommands', () => {
    it('should fetch pending commands successfully when user is authorized', async () => {
      const callerId = 'test-caller-id';
      const expectedResponse = new FetchPendingCommandsResponse(null);

      mockAuthorizationService.canAccessEmployee.mockResolvedValue(true);
      mockPendingCommandDomainService.fetchPendingCommands.mockResolvedValue(expectedResponse);

      const result = await fetchPendingCommandsApplicationService.fetchPendingCommands(callerId);

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandDomainService.fetchPendingCommands).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResponse);
    });

    it('should throw PendingCommandAccessDeniedError when user is not authorized', async () => {
      const callerId = 'test-caller-id';

      mockAuthorizationService.canAccessEmployee.mockResolvedValue(false);

      await expect(fetchPendingCommandsApplicationService.fetchPendingCommands(callerId))
        .rejects.toThrow(PendingCommandAccessDeniedError);

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandDomainService.fetchPendingCommands).not.toHaveBeenCalled();
    });

    it('should throw PendingCommandAccessDeniedError with correct message when user is not authorized', async () => {
      const callerId = 'test-caller-id';

      mockAuthorizationService.canAccessEmployee.mockResolvedValue(false);

      await expect(fetchPendingCommandsApplicationService.fetchPendingCommands(callerId))
        .rejects.toThrow('Insufficient privileges to fetch pending commands');

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandDomainService.fetchPendingCommands).not.toHaveBeenCalled();
    });

    it('should propagate domain service errors', async () => {
      const callerId = 'test-caller-id';
      const domainError = new Error('Domain service error');

      mockAuthorizationService.canAccessEmployee.mockResolvedValue(true);
      mockPendingCommandDomainService.fetchPendingCommands.mockRejectedValue(domainError);

      await expect(fetchPendingCommandsApplicationService.fetchPendingCommands(callerId))
        .rejects.toThrow('Domain service error');

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandDomainService.fetchPendingCommands).toHaveBeenCalledWith(callerId);
    });

    it('should handle authorization service errors', async () => {
      const callerId = 'test-caller-id';
      const authError = new Error('Authorization service error');

      mockAuthorizationService.canAccessEmployee.mockRejectedValue(authError);

      await expect(fetchPendingCommandsApplicationService.fetchPendingCommands(callerId))
        .rejects.toThrow('Authorization service error');

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandDomainService.fetchPendingCommands).not.toHaveBeenCalled();
    });

    it('should handle different caller IDs', async () => {
      const callerId1 = 'test-caller-id-1';
      const callerId2 = 'test-caller-id-2';
      const expectedResponse = new FetchPendingCommandsResponse(null);

      mockAuthorizationService.canAccessEmployee.mockResolvedValue(true);
      mockPendingCommandDomainService.fetchPendingCommands.mockResolvedValue(expectedResponse);

      await fetchPendingCommandsApplicationService.fetchPendingCommands(callerId1);
      await fetchPendingCommandsApplicationService.fetchPendingCommands(callerId2);

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId1);
      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId2);
      expect(mockPendingCommandDomainService.fetchPendingCommands).toHaveBeenCalledWith(callerId1);
      expect(mockPendingCommandDomainService.fetchPendingCommands).toHaveBeenCalledWith(callerId2);
    });

    it('should handle empty caller ID', async () => {
      const callerId = '';
      const expectedResponse = new FetchPendingCommandsResponse(null);

      mockAuthorizationService.canAccessEmployee.mockResolvedValue(true);
      mockPendingCommandDomainService.fetchPendingCommands.mockResolvedValue(expectedResponse);

      const result = await fetchPendingCommandsApplicationService.fetchPendingCommands(callerId);

      expect(mockAuthorizationService.canAccessEmployee).toHaveBeenCalledWith(callerId);
      expect(mockPendingCommandDomainService.fetchPendingCommands).toHaveBeenCalledWith(callerId);
      expect(result).toBe(expectedResponse);
    });
  });
});
