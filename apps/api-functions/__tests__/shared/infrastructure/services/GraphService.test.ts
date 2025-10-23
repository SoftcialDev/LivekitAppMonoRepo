/**
 * @fileoverview Tests for GraphService
 * @description Tests for Microsoft Graph API operations
 */

import { GraphService } from '../../../../shared/infrastructure/services/GraphService';
import axios from 'axios';
import qs from 'qs';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock qs
jest.mock('qs');
const mockedQs = qs as jest.Mocked<typeof qs>;

// Mock config
jest.mock('../../../../shared/config', () => ({
  config: {
    azureTenantId: 'test-tenant-id',
    azureClientId: 'test-client-id',
    azureClientSecret: 'test-client-secret'
  }
}));

describe('GraphService', () => {
  let graphService: GraphService;

  beforeEach(() => {
    jest.clearAllMocks();
    graphService = new GraphService();
    
    // Setup default mocks
    mockedQs.stringify.mockReturnValue('mocked-query-string');
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
    it('should acquire token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-access-token'
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await graphService.getGraphToken();

      expect(result).toBe('mock-access-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://login.microsoftonline.com/test-tenant-id/oauth2/v2.0/token',
        'mocked-query-string',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      expect(mockedQs.stringify).toHaveBeenCalledWith({
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      });
    });

    it('should throw error when access_token is missing', async () => {
      const mockResponse = {
        data: {
          token_type: 'Bearer',
          expires_in: 3600
          // Missing access_token
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(graphService.getGraphToken())
        .rejects.toThrow('Token response did not contain access_token');
    });

    it('should handle HTTP error responses', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: 'invalid_request' }
        }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(graphService.getGraphToken())
        .rejects.toThrow('Failed to acquire Graph token: HTTP 400 - {"error":"invalid_request"}');
    });

    it('should handle network errors', async () => {
      const mockError = {
        message: 'Network error'
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(graphService.getGraphToken())
        .rejects.toThrow('Failed to acquire Graph token: Network error');
    });
  });

  describe('assignAppRoleToPrincipal', () => {
    const mockToken = 'test-token';
    const mockSpId = 'test-sp-id';
    const mockUserId = 'test-user-id';
    const mockRoleId = 'test-role-id';

    it('should assign app role successfully', async () => {
      mockedAxios.post.mockResolvedValue({ status: 201 });

      await graphService.assignAppRoleToPrincipal(mockToken, mockSpId, mockUserId, mockRoleId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo`,
        {
          principalId: mockUserId,
          resourceId: mockSpId,
          appRoleId: mockRoleId
        },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle assignment errors', async () => {
      const mockError = new Error('Role already assigned') as any;
      mockError.response = {
        status: 400,
        data: { error: 'Role already assigned' }
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(graphService.assignAppRoleToPrincipal(mockToken, mockSpId, mockUserId, mockRoleId))
        .rejects.toThrow('Role already assigned');
    });
  });

  describe('removeAllAppRolesFromPrincipalOnSp', () => {
    const mockToken = 'test-token';
    const mockSpId = 'test-sp-id';
    const mockUserId = 'test-user-id';

    it('should remove all app roles successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            { id: 'assignment1', principalId: mockUserId },
            { id: 'assignment2', principalId: 'other-user' },
            { id: 'assignment3', principalId: mockUserId }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockedAxios.delete.mockResolvedValue({ status: 204 });

      await graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockSpId}/appRoleAssignedTo?$top=100`,
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
      expect(mockedAxios.delete).toHaveBeenCalledTimes(2); // Only for matching principalId
    });

    it('should handle pagination', async () => {
      const firstPageResponse = {
        status: 200,
        data: {
          value: [
            { id: 'assignment1', principalId: mockUserId }
          ],
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/servicePrincipals/test-sp-id/appRoleAssignedTo?$skip=100'
        }
      };

      const secondPageResponse = {
        status: 200,
        data: {
          value: [
            { id: 'assignment2', principalId: mockUserId }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);
      mockedAxios.delete.mockResolvedValue({ status: 204 });

      await graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId);

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle non-200 status', async () => {
      const mockResponse = {
        status: 400,
        data: { error: 'Bad request' }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId))
        .rejects.toThrow('Failed to list appRoleAssignedTo: 400 {"error":"Bad request"}');
    });

    it('should handle delete errors', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            { id: 'assignment1', principalId: mockUserId }
          ]
        }
      };

      const deleteError = {
        response: {
          status: 404,
          data: { error: 'Not found' }
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockedAxios.delete.mockRejectedValue(deleteError);

      await expect(graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId))
        .rejects.toThrow('Failed to delete appRoleAssignedTo assignment1: HTTP 404 - {"error":"Not found"}');
    });

    it('should handle delete errors without response', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            { id: 'assignment1', principalId: mockUserId }
          ]
        }
      };

      const deleteError = {
        message: 'Network error'
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockedAxios.delete.mockRejectedValue(deleteError);

      await expect(graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId))
        .rejects.toThrow('Failed to delete appRoleAssignedTo assignment1: Network error');
    });

    it('should skip assignments without id', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            { principalId: mockUserId }, // Missing id
            { id: 'assignment1', principalId: mockUserId }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockedAxios.delete.mockResolvedValue({ status: 204 });

      await graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId);

      expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    });

    it('should skip assignments with different principalId', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            { id: 'assignment1', principalId: 'other-user' },
            { id: 'assignment2', principalId: mockUserId }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockedAxios.delete.mockResolvedValue({ status: 204 });

      await graphService.removeAllAppRolesFromPrincipalOnSp(mockToken, mockSpId, mockUserId);

      expect(mockedAxios.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchAllUsers', () => {
    const mockToken = 'test-token';

    it('should fetch all users successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            {
              id: 'user1',
              displayName: 'User One',
              mail: 'user1@example.com',
              userPrincipalName: 'user1@example.com',
              accountEnabled: true
            },
            {
              id: 'user2',
              displayName: 'User Two',
              mail: 'user2@example.com',
              userPrincipalName: 'user2@example.com',
              accountEnabled: false
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAllUsers(mockToken);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user1',
              displayName: 'User One',
              mail: 'user1@example.com',
              userPrincipalName: 'user1@example.com',
        accountEnabled: true
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,accountEnabled&$top=100',
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
    });

    it('should handle pagination', async () => {
      const firstPageResponse = {
        status: 200,
        data: {
          value: [
            { id: 'user1', displayName: 'User One' }
          ],
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/users?$skip=100'
        }
      };

      const secondPageResponse = {
        status: 200,
        data: {
          value: [
            { id: 'user2', displayName: 'User Two' }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const result = await graphService.fetchAllUsers(mockToken);

      expect(result).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle non-200 status', async () => {
      const mockResponse = {
        status: 400,
        data: { error: 'Bad request' }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(graphService.fetchAllUsers(mockToken))
        .rejects.toThrow('Graph /users returned status 400: {"error":"Bad request"}');
    });

    it('should handle HTTP error responses', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' }
        }
      };

      mockedAxios.get.mockRejectedValue(mockError);

      await expect(graphService.fetchAllUsers(mockToken))
        .rejects.toThrow('Error fetching users: HTTP 401 - {"error":"Unauthorized"}');
    });

    it('should handle network errors', async () => {
      const mockError = {
        message: 'Network error'
      };

      mockedAxios.get.mockRejectedValue(mockError);

      await expect(graphService.fetchAllUsers(mockToken))
        .rejects.toThrow('Error fetching users: Network error');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAllUsers(mockToken);

      expect(result).toHaveLength(0);
    });

    it('should handle non-array value', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: 'not-an-array'
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAllUsers(mockToken);

      expect(result).toHaveLength(0);
    });
  });

  describe('fetchAppRoleMemberIds', () => {
      const mockToken = 'test-token';
    const mockServicePrincipalId = 'test-sp-id';
    const mockAppRoleId = 'test-role-id';

    it('should fetch app role member IDs successfully', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            {
              appRoleId: mockAppRoleId,
              principalId: 'user1'
            },
            {
              appRoleId: 'other-role-id',
              principalId: 'user2'
            },
            {
              appRoleId: mockAppRoleId,
              principalId: 'user3'
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(result).toEqual(new Set(['user1', 'user3']));
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${mockServicePrincipalId}/appRoleAssignedTo?$top=100`,
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
    });

    it('should throw error when servicePrincipalId is missing', async () => {
      await expect(graphService.fetchAppRoleMemberIds(mockToken, '', mockAppRoleId))
        .rejects.toThrow('servicePrincipalId is required');
    });

    it('should throw error when appRoleId is missing', async () => {
      await expect(graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, ''))
        .rejects.toThrow('appRoleId is required');
    });

    it('should handle pagination', async () => {
      const firstPageResponse = {
        status: 200,
        data: {
          value: [
            { appRoleId: mockAppRoleId, principalId: 'user1' }
          ],
          '@odata.nextLink': 'https://graph.microsoft.com/v1.0/servicePrincipals/test-sp-id/appRoleAssignedTo?$skip=100'
        }
      };

      const secondPageResponse = {
        status: 200,
        data: {
          value: [
            { appRoleId: mockAppRoleId, principalId: 'user2' }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const result = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(result).toEqual(new Set(['user1', 'user2']));
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle non-200 status', async () => {
      const mockResponse = {
        status: 400,
        data: { error: 'Bad request' }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId))
        .rejects.toThrow('Graph failed: 400 – {"error":"Bad request"}');
    });

    it('should handle empty value array', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: []
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(result).toEqual(new Set());
    });

    it('should handle missing principalId', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: [
            {
              appRoleId: mockAppRoleId,
              principalId: 'user1'
            },
            {
              appRoleId: mockAppRoleId
              // Missing principalId
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(result).toEqual(new Set(['user1']));
    });

    it('should handle null value', async () => {
      const mockResponse = {
        status: 200,
        data: {
          value: null
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await graphService.fetchAppRoleMemberIds(mockToken, mockServicePrincipalId, mockAppRoleId);

      expect(result).toEqual(new Set());
    });
  });
});