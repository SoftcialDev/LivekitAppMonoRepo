/**
 * @fileoverview Tests for GraphService
 * @description Tests for Microsoft Graph API interactions
 */

import { GraphService, GraphUser } from '../../../../shared/infrastructure/services/GraphService';

// Mock dependencies
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('qs', () => ({
  stringify: jest.fn(),
}));

jest.mock('../../../../shared/config', () => ({
  config: {
    azureTenantId: 'test-tenant-id',
    azureClientId: 'test-client-id',
    azureClientSecret: 'test-client-secret',
  },
}));

describe('GraphService', () => {
  let graphService: GraphService;
  let mockAxios: any;
  let mockQs: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    graphService = new GraphService();
    
    // Get mocked instances
    mockAxios = require('axios');
    mockQs = require('qs');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create GraphService instance', () => {
      expect(graphService).toBeInstanceOf(GraphService);
    });
  });

  describe('getGraphToken', () => {
    it('should get graph token successfully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockQs.stringify.mockReturnValue('client_id=test-client-id&client_secret=test-client-secret&scope=https://graph.microsoft.com/.default&grant_type=client_credentials');

      const result = await graphService.getGraphToken();

      expect(result).toBe('test-access-token');
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/token',
        'client_id=test-client-id&client_secret=test-client-secret&scope=https://graph.microsoft.com/.default&grant_type=client_credentials',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
    });

    it('should handle missing Azure AD config', async () => {
      // Mock missing config
      jest.doMock('../../../../shared/config', () => ({
        config: {
          azureTenantId: null,
          azureClientId: 'test-client-id',
          azureClientSecret: 'test-client-secret',
        },
      }));

      const service = new GraphService();
      
      await expect(service.getGraphToken())
        .rejects.toThrow('Missing Azure AD config: azureTenantId, azureClientId, or azureClientSecret');
    });

    it('should handle axios errors', async () => {
      const axiosError = new Error('Network error');
      mockAxios.post.mockRejectedValue(axiosError);

      await expect(graphService.getGraphToken())
        .rejects.toThrow('Network error');
    });

    it('should handle invalid token response', async () => {
      const invalidResponse = {
        data: {
          error: 'invalid_client',
          error_description: 'Invalid client credentials',
        },
      };

      mockAxios.post.mockResolvedValue(invalidResponse);

      await expect(graphService.getGraphToken())
        .rejects.toThrow('Failed to acquire Graph token: Invalid client credentials');
    });
  });

  describe('assignAppRoleToPrincipal', () => {
    const mockToken = 'test-access-token';
    const mockSpId = 'sp-123';
    const mockUserId = 'user-123';
    const mockRoleId = 'role-123';

    it('should assign app role successfully', async () => {
      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, mockUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: mockUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle assignment errors', async () => {
      const assignmentError = new Error('Assignment failed');
      mockAxios.post.mockRejectedValue(assignmentError);

      await expect(graphService.assignAppRoleToPrincipal(mockToken, mockSpId, mockUserId, mockRoleId))
        .rejects.toThrow('Assignment failed');
    });
  });

  describe('removeAllAppRolesFromPrincipalOnSp', () => {
    const mockToken = 'test-access-token';
    const mockSpId = 'sp-123';
    const mockUserId = 'user-123';

    it('should remove all app roles successfully', async () => {
      const mockRoleAssignments = {
        data: {
          value: [
            { id: 'assignment-1', principalId: mockUserId },
            { id: 'assignment-2', principalId: 'other-user' },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockRoleAssignments);
      mockAxios.delete.mockResolvedValue({ status: 204 });

      await graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId);

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo?$top=100`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(mockAxios.delete).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo/assignment-1`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should handle removal errors', async () => {
      const removalError = new Error('Removal failed');
      mockAxios.get.mockRejectedValue(removalError);

      await expect(graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId))
        .rejects.toThrow('Removal failed');
    });
  });

  describe('fetchAllUsers', () => {
    const mockToken = 'test-access-token';

    it('should fetch all users successfully', async () => {
      const mockUsersResponse = {
        data: {
          value: [
            {
              id: 'user-1',
              displayName: 'User One',
              mail: 'user1@example.com',
              userPrincipalName: 'user1@example.com',
              accountEnabled: true,
            },
            {
              id: 'user-2',
              displayName: 'User Two',
              mail: 'user2@example.com',
              userPrincipalName: 'user2@example.com',
              accountEnabled: false,
            },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockUsersResponse);

      const result = await graphService.fetchAllUsers(mockToken);

      expect(result).toEqual([
            {
              id: 'user-1',
              displayName: 'User One',
              mail: 'user1@example.com',
              userPrincipalName: 'user1@example.com',
              accountEnabled: true,
            },
            {
              id: 'user-2',
              displayName: 'User Two',
              mail: 'user2@example.com',
              userPrincipalName: 'user2@example.com',
              accountEnabled: false,
            },
          ]);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/users?$top=999',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should handle fetch errors', async () => {
      const fetchError = new Error('Fetch failed');
      mockAxios.get.mockRejectedValue(fetchError);

      await expect(graphService.fetchAllUsers(mockToken))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('fetchAppRoleMemberIds', () => {
    const mockToken = 'test-access-token';
    const mockServicePrincipalId = 'sp-123';
    const mockAppRoleId = 'role-123';

    it('should fetch app role member IDs successfully', async () => {
      const mockMembersResponse = {
        data: {
          value: [
            { principalId: 'user-1' },
            { principalId: 'user-2' },
            { principalId: 'user-3' },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockMembersResponse);

      const result = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(result).toEqual(new Set(['user-1', 'user-2', 'user-3']));

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockServicePrincipalId}/appRoleAssignedTo?$filter=appRoleId eq '${mockAppRoleId}'`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should handle fetch errors', async () => {
      const fetchError = new Error('Fetch failed');
      mockAxios.get.mockRejectedValue(fetchError);

      await expect(graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('edge cases', () => {
    it('should handle very long service principal IDs', async () => {
      const longSpId = 'A'.repeat(1000);
      const mockToken = 'test-access-token';
      const mockUserId = 'user-123';
      const mockRoleId = 'role-123';

      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, longSpId, mockUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${longSpId}/appRoleAssignedTo`,
        {
          principalId: mockUserId,
          resourceId: longSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle special characters in user IDs', async () => {
      const specialUserId = 'user-with-special-chars-@#$%';
      const mockToken = 'test-access-token';
      const mockSpId = 'sp-123';
      const mockRoleId = 'role-123';

      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, specialUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: specialUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle unicode characters in user IDs', async () => {
      const unicodeUserId = '用户-123';
      const mockToken = 'test-access-token';
      const mockSpId = 'sp-123';
      const mockRoleId = 'role-123';

      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, unicodeUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: unicodeUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle empty user IDs', async () => {
      const emptyUserId = '';
      const mockToken = 'test-access-token';
      const mockSpId = 'sp-123';
      const mockRoleId = 'role-123';

      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, emptyUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: emptyUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle null user IDs', async () => {
      const nullUserId = null as any;
      const mockToken = 'test-access-token';
      const mockSpId = 'sp-123';
      const mockRoleId = 'role-123';

      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, nullUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: nullUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('validation scenarios', () => {
    it('should handle authentication scenario', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'auth-token-123',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockQs.stringify.mockReturnValue('client_id=test-client-id&client_secret=test-client-secret&scope=https://graph.microsoft.com/.default&grant_type=client_credentials');

      const token = await graphService.getGraphToken();

      expect(token).toBe('auth-token-123');
    });

    it('should handle role assignment scenario', async () => {
      const mockToken = 'test-token';
      const mockSpId = 'sp-123';
      const mockUserId = 'user-123';
      const mockRoleId = 'role-123';

      mockAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, mockUserId, mockRoleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: mockUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle role removal scenario', async () => {
      const mockToken = 'test-token';
      const mockSpId = 'sp-123';
      const mockUserId = 'user-123';

      const mockRoleAssignments = {
        data: {
          value: [
            { id: 'assignment-1', principalId: mockUserId },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockRoleAssignments);
      mockAxios.delete.mockResolvedValue({ status: 204 });

      await graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId);

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo?$top=100`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(mockAxios.delete).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo/assignment-1`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should handle user fetching scenario', async () => {
      const mockToken = 'test-token';
      const mockUsersResponse = {
        data: {
          value: [
            {
              id: 'user-1',
              displayName: 'Test User',
              mail: 'test@example.com',
              userPrincipalName: 'test@example.com',
              accountEnabled: true,
            },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockUsersResponse);

      const users = await graphService.fetchAllUsers(mockToken);

      expect(users).toEqual([
        {
          id: 'user-1',
          displayName: 'Test User',
          mail: 'test@example.com',
          userPrincipalName: 'test@example.com',
          accountEnabled: true,
        },
      ]);
    });

    it('should handle app role member fetching scenario', async () => {
      const mockToken = 'test-token';
      const mockServicePrincipalId = 'sp-123';
      const mockAppRoleId = 'role-123';

      const mockMembersResponse = {
        data: {
          value: [
            { principalId: 'user-1' },
            { principalId: 'user-2' },
          ],
        },
      };

      mockAxios.get.mockResolvedValue(mockMembersResponse);

      const members = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(members).toEqual(new Set(['user-1', 'user-2']));
    });

    it('should handle bulk operations scenario', async () => {
      const operations = [
        { type: 'assign', spId: 'sp-1', userId: 'user-1', roleId: 'role-1' },
        { type: 'assign', spId: 'sp-2', userId: 'user-2', roleId: 'role-2' },
        { type: 'remove', spId: 'sp-3', userId: 'user-3' },
      ];

      mockAxios.post.mockResolvedValue({ status: 201 });
      mockAxios.get.mockResolvedValue({ data: { value: [] } });
      mockAxios.delete.mockResolvedValue({ status: 204 });

      for (const operation of operations) {
        if (operation.type === 'assign') {
          await graphService.assignAppRoleToPrincipal('token', operation.spId, operation.userId, operation.roleId);
        } else if (operation.type === 'remove') {
          await graphService.removeAllAppRolesFromPrincipalOnSp('token', operation.spId, operation.userId);
        }
      }

      expect(mockAxios.post).toHaveBeenCalledTimes(2);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      expect(mockAxios.delete).toHaveBeenCalledTimes(0);
    });

    it('should handle concurrent operations scenario', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'concurrent-token',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      };

      const mockUsersResponse = {
        data: {
          value: [
            {
              id: 'user-1',
              displayName: 'Test User',
              mail: 'test@example.com',
              userPrincipalName: 'test@example.com',
              accountEnabled: true,
            },
          ],
        },
      };

      mockAxios.post.mockResolvedValue(mockTokenResponse);
      mockAxios.get.mockResolvedValue(mockUsersResponse);
      mockQs.stringify.mockReturnValue('client_id=test-client-id&client_secret=test-client-secret&scope=https://graph.microsoft.com/.default&grant_type=client_credentials');

      const promises = [
        graphService.getGraphToken(),
        graphService.fetchAllUsers('token'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBe('concurrent-token');
      expect(results[1]).toEqual([
        {
          id: 'user-1',
          displayName: 'Test User',
          mail: 'test@example.com',
          userPrincipalName: 'test@example.com',
          accountEnabled: true,
        },
      ]);
    });
  });
});