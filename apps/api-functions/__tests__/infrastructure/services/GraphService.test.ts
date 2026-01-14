import { GraphService } from '../../../src/infrastructure/services/GraphService';
import { ConfigurationError, GraphServiceError } from '../../../src/domain/errors/InfrastructureErrors';
import axios from 'axios';
import qs from 'qs';
import { config } from '../../../src/config';
import { extractAxiosErrorMessage } from '../../../src/utils/error/ErrorHelpers';

jest.mock('axios');
jest.mock('qs');
jest.mock('../../../src/config', () => ({
  config: {
    azureTenantId: 'tenant-id',
    azureClientId: 'client-id',
    azureClientSecret: 'client-secret',
  },
}));
jest.mock('../../../src/utils/error/ErrorHelpers');

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockQs = qs as jest.Mocked<typeof qs>;
const mockExtractAxiosErrorMessage = extractAxiosErrorMessage as jest.MockedFunction<typeof extractAxiosErrorMessage>;

describe('GraphService', () => {
  let service: GraphService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GraphService();
  });

  describe('getGraphToken', () => {
    it('should return access token when successful', async () => {
      const token = 'access-token';
      mockQs.stringify.mockReturnValue('params');
      mockAxios.post.mockResolvedValue({
        data: { access_token: token },
      } as any);

      const result = await service.getGraphToken();

      expect(mockQs.stringify).toHaveBeenCalled();
      expect(mockAxios.post).toHaveBeenCalled();
      expect(result).toBe(token);
    });

    it('should throw ConfigurationError when config is missing', async () => {
      const originalConfig = { ...config };
      (config as any).azureTenantId = undefined;

      await expect(service.getGraphToken()).rejects.toThrow(ConfigurationError);
      await expect(service.getGraphToken()).rejects.toThrow('Missing Azure AD config');

      (config as any).azureTenantId = originalConfig.azureTenantId;
    });

    it('should throw GraphServiceError when access_token is missing', async () => {
      mockQs.stringify.mockReturnValue('params');
      mockAxios.post.mockResolvedValue({
        data: {},
      } as any);
      mockExtractAxiosErrorMessage.mockReturnValue('undefined');

      await expect(service.getGraphToken()).rejects.toThrow(GraphServiceError);
      // The error is caught and wrapped, so we check for the wrapped message
      await expect(service.getGraphToken()).rejects.toThrow('Failed to acquire Graph token');
    });

    it('should throw GraphServiceError when request fails', async () => {
      const error = new Error('Network error');
      mockQs.stringify.mockReturnValue('params');
      mockAxios.post.mockRejectedValue(error);
      mockExtractAxiosErrorMessage.mockReturnValue('Network error');

      await expect(service.getGraphToken()).rejects.toThrow(GraphServiceError);
      await expect(service.getGraphToken()).rejects.toThrow('Failed to acquire Graph token');
    });
  });

  describe('assignAppRoleToPrincipal', () => {
    it('should assign app role successfully', async () => {
      const token = 'token';
      const spId = 'sp-id';
      const userId = 'user-id';
      const roleId = 'role-id';

      mockAxios.post.mockResolvedValue({} as any);

      await service.assignAppRoleToPrincipal(token, spId, userId, roleId);

      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://graph.microsoft.com/v1.0/servicePrincipals/${spId}/appRoleAssignedTo`,
        {
          principalId: userId,
          resourceId: spId,
          appRoleId: roleId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe('removeAllAppRolesFromPrincipalOnSp', () => {
    it('should remove all app roles successfully', async () => {
      const token = 'token';
      const spId = 'sp-id';
      const userId = 'user-id';

      mockAxios.get
        .mockResolvedValueOnce({
          status: 200,
          data: {
            value: [
              { id: 'assignment-1', principalId: userId, appRoleId: 'role-1' },
              { id: 'assignment-2', principalId: 'other-user', appRoleId: 'role-2' },
            ],
          },
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          data: { value: [] },
        } as any);

      mockAxios.delete.mockResolvedValue({} as any);

      await service.removeAllAppRolesFromPrincipalOnSp(token, spId, userId);

      expect(mockAxios.get).toHaveBeenCalled();
      expect(mockAxios.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination', async () => {
      const token = 'token';
      const spId = 'sp-id';
      const userId = 'user-id';

      const nextLink = 'https://graph.microsoft.com/v1.0/servicePrincipals/sp-id/appRoleAssignedTo?$top=100&$skip=100';

      jest.clearAllMocks();
      mockAxios.get.mockReset();
      mockAxios.delete.mockReset();

      mockAxios.get
        .mockResolvedValueOnce({
          status: 200,
          data: {
            value: [{ id: 'assignment-1', principalId: userId, appRoleId: 'role-1' }],
            '@odata.nextLink': nextLink,
          },
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          data: { 
            value: [{ id: 'assignment-2', principalId: 'other-user', appRoleId: 'role-2' }],
          },
        } as any);

      mockAxios.delete.mockResolvedValue({} as any);

      await service.removeAllAppRolesFromPrincipalOnSp(token, spId, userId);

      expect(mockAxios.get).toHaveBeenCalledTimes(2);
      expect(mockAxios.get).toHaveBeenNthCalledWith(1, expect.stringContaining('servicePrincipals'), expect.any(Object));
      expect(mockAxios.get).toHaveBeenNthCalledWith(2, nextLink, expect.any(Object));
      expect(mockAxios.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw error when request fails', async () => {
      const token = 'token';
      const spId = 'sp-id';
      const userId = 'user-id';

      jest.clearAllMocks();
      mockAxios.get.mockReset();

      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.removeAllAppRolesFromPrincipalOnSp(token, spId, userId)
      ).rejects.toThrow('Network error');
    });

    it('should throw GraphServiceError when delete fails', async () => {
      const token = 'token';
      const spId = 'sp-id';
      const userId = 'user-id';

      jest.clearAllMocks();

      mockAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          value: [{ id: 'assignment-1', principalId: userId, appRoleId: 'role-1' }],
        },
      } as any);

      const axiosError = {
        response: {
          status: 500,
          data: { error: { message: 'Delete failed' } },
        },
        isAxiosError: true,
      } as any;

      mockAxios.delete.mockRejectedValueOnce(axiosError);

      await expect(
        service.removeAllAppRolesFromPrincipalOnSp(token, spId, userId)
      ).rejects.toThrow(GraphServiceError);
    });

    it('should throw GraphServiceError when response status is not 200', async () => {
      const token = 'token';
      const spId = 'sp-id';
      const userId = 'user-id';

      jest.clearAllMocks();

      mockAxios.get.mockResolvedValueOnce({
        status: 500,
        data: { error: { message: 'Internal Server Error' } },
      } as any);

      await expect(
        service.removeAllAppRolesFromPrincipalOnSp(token, spId, userId)
      ).rejects.toThrow(GraphServiceError);
    });
  });

  describe('fetchAllUsers', () => {
    it('should fetch all users successfully', async () => {
      const token = 'token';
      const mockUsers = [
        { id: 'user-1', displayName: 'User 1', mail: 'user1@example.com' },
        { id: 'user-2', displayName: 'User 2', mail: 'user2@example.com' },
      ];

      jest.clearAllMocks();
      mockAxios.get.mockReset();

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { value: mockUsers },
      } as any);

      const result = await service.fetchAllUsers(token);

      expect(mockAxios.get).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should handle pagination', async () => {
      const token = 'token';
      const mockUsers1 = [{ id: 'user-1' }];
      const mockUsers2 = [{ id: 'user-2' }];

      mockAxios.get
        .mockResolvedValueOnce({
          status: 200,
          data: {
            value: mockUsers1,
            '@odata.nextLink': 'https://graph.microsoft.com/v1.0/next',
          },
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          data: { value: mockUsers2 },
        } as any);

      const result = await service.fetchAllUsers(token);

      expect(result).toEqual([...mockUsers1, ...mockUsers2]);
    });

    it('should throw GraphServiceError when request fails', async () => {
      const token = 'token';
      mockAxios.get.mockResolvedValue({
        status: 500,
        data: {},
      } as any);

      await expect(service.fetchAllUsers(token)).rejects.toThrow(GraphServiceError);
    });
  });

  describe('fetchAppRoleMemberIds', () => {
    it('should fetch app role member IDs successfully', async () => {
      const token = 'token';
      const servicePrincipalId = 'sp-id';
      const appRoleId = 'role-id';

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: {
          value: [
            { appRoleId: 'role-id', principalId: 'user-1' },
            { appRoleId: 'other-role', principalId: 'user-2' },
            { appRoleId: 'role-id', principalId: 'user-3' },
          ],
        },
      } as any);

      const result = await service.fetchAppRoleMemberIds(token, servicePrincipalId, appRoleId);

      expect(result).toEqual(new Set(['user-1', 'user-3']));
    });

    it('should throw ConfigurationError when servicePrincipalId is missing', async () => {
      const token = 'token';
      const appRoleId = 'role-id';

      await expect(
        service.fetchAppRoleMemberIds(token, '', appRoleId)
      ).rejects.toThrow(ConfigurationError);
    });

    it('should throw ConfigurationError when appRoleId is missing', async () => {
      const token = 'token';
      const servicePrincipalId = 'sp-id';

      await expect(
        service.fetchAppRoleMemberIds(token, servicePrincipalId, '')
      ).rejects.toThrow(ConfigurationError);
    });

    it('should throw GraphServiceError when response status is not 200', async () => {
      const token = 'token';
      const servicePrincipalId = 'sp-id';
      const appRoleId = 'role-id';

      mockAxios.get.mockResolvedValueOnce({
        status: 500,
        data: { error: { message: 'Internal Server Error' } },
      } as any);

      await expect(
        service.fetchAppRoleMemberIds(token, servicePrincipalId, appRoleId)
      ).rejects.toThrow(GraphServiceError);
    });

    it('should handle pagination in fetchAppRoleMemberIds', async () => {
      const token = 'token';
      const servicePrincipalId = 'sp-id';
      const appRoleId = 'role-id';

      mockAxios.get
        .mockResolvedValueOnce({
          status: 200,
          data: {
            value: [
              { appRoleId: 'role-id', principalId: 'user-1' },
            ],
            '@odata.nextLink': 'https://graph.microsoft.com/v1.0/servicePrincipals/sp-id/appRoleAssignedTo?$top=100&$skip=100',
          },
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          data: {
            value: [
              { appRoleId: 'role-id', principalId: 'user-2' },
            ],
            '@odata.nextLink': '',
          },
        } as any);

      const result = await service.fetchAppRoleMemberIds(token, servicePrincipalId, appRoleId);

      expect(result).toEqual(new Set(['user-1', 'user-2']));
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});

