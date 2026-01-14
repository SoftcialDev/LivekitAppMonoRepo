import { getCurrentUser, refreshUserInfo } from '@/modules/auth/api/userInfoClient';
import { ApiError } from '@/shared/errors';
import apiClient from '@/shared/api/apiClient';
import { UserRole } from '@/modules/auth/enums';
import type { UserInfo } from '@/modules/auth/types';

// Mock dependencies
jest.mock('@/shared/api/apiClient');
jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('userInfoClient', () => {
  const mockUserInfo: UserInfo = {
    azureAdObjectId: 'test-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.PSO,
    permissions: ['permission1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch and return user information', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockUserInfo });

      const result = await getCurrentUser();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/GetCurrentUser');
      expect(result).toEqual(mockUserInfo);
    });

    it('should throw ApiError when request fails with ApiError', async () => {
      const apiError = new ApiError('API Error');
      mockedApiClient.get.mockRejectedValue(apiError);

      await expect(getCurrentUser()).rejects.toThrow(apiError);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/GetCurrentUser');
    });

    it('should wrap generic errors in ApiError', async () => {
      const genericError = new Error('Network error');
      mockedApiClient.get.mockRejectedValue(genericError);

      await expect(getCurrentUser()).rejects.toThrow(ApiError);
      await expect(getCurrentUser()).rejects.toThrow(
        'Failed to fetch user information. Please try again later.'
      );
    });

    it('should wrap non-Error objects in ApiError', async () => {
      mockedApiClient.get.mockRejectedValue('String error');

      await expect(getCurrentUser()).rejects.toThrow(ApiError);
    });
  });

  describe('refreshUserInfo', () => {
    it('should call getCurrentUser and return user information', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockUserInfo });

      const result = await refreshUserInfo();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/GetCurrentUser');
      expect(result).toEqual(mockUserInfo);
    });

    it('should throw error when request fails', async () => {
      const apiError = new ApiError('API Error');
      mockedApiClient.get.mockRejectedValue(apiError);

      await expect(refreshUserInfo()).rejects.toThrow(apiError);
    });
  });
});

