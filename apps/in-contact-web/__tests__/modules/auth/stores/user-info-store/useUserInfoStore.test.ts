import { renderHook, act } from '@testing-library/react';
import { useUserInfoStore } from '@/modules/auth/stores/user-info-store/useUserInfoStore';
import { UserInfoService } from '@/modules/auth/services/UserInfoService';
import { getCurrentUser } from '@/modules/auth/api/userInfoClient';
import { UserRole } from '@/modules/auth/enums';
import type { UserInfo } from '@/modules/auth/types';

// Mock dependencies
jest.mock('@/modules/auth/api/userInfoClient');
jest.mock('@/modules/auth/services/UserInfoService');
jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
}));

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedUserInfoService = UserInfoService as jest.Mocked<typeof UserInfoService>;

describe('useUserInfoStore', () => {
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
    localStorage.clear();
    // Reset store state
    const store = useUserInfoStore.getState();
    store.clearUserInfo();
  });

  describe('initialization', () => {
    it('should initialize with null userInfo and false isLoading', () => {
      const { result } = renderHook(() => useUserInfoStore());
      
      expect(result.current.userInfo).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should load user info from localStorage if available', () => {
      mockedUserInfoService.load.mockReturnValue(mockUserInfo);
      
      const store = useUserInfoStore.getState();
      act(() => {
        store.initialize();
      });

      const state = useUserInfoStore.getState();
      expect(state.userInfo).toEqual(mockUserInfo);
      expect(mockedUserInfoService.load).toHaveBeenCalled();
    });

    it('should not set userInfo if localStorage is empty', () => {
      mockedUserInfoService.load.mockReturnValue(null);
      
      const store = useUserInfoStore.getState();
      act(() => {
        store.initialize();
      });

      const state = useUserInfoStore.getState();
      expect(state.userInfo).toBeNull();
    });
  });

  describe('loadUserInfo', () => {
    it('should load user info from API and save to localStorage', async () => {
      mockedGetCurrentUser.mockResolvedValue(mockUserInfo);
      
      const store = useUserInfoStore.getState();
      
      await act(async () => {
        await store.loadUserInfo();
      });

      const state = useUserInfoStore.getState();
      expect(state.userInfo).toEqual(mockUserInfo);
      expect(state.isLoading).toBe(false);
      expect(mockedGetCurrentUser).toHaveBeenCalled();
      expect(mockedUserInfoService.save).toHaveBeenCalledWith(mockUserInfo);
    });

    it('should set isLoading to true while loading', async () => {
      mockedGetCurrentUser.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockUserInfo), 100)));
      
      const store = useUserInfoStore.getState();
      const loadPromise = store.loadUserInfo();

      // Check loading state immediately
      const loadingState = useUserInfoStore.getState();
      expect(loadingState.isLoading).toBe(true);

      await act(async () => {
        await loadPromise;
      });

      const finalState = useUserInfoStore.getState();
      expect(finalState.isLoading).toBe(false);
    });

    it('should clear userInfo and localStorage on error', async () => {
      const error = new Error('Failed to load');
      mockedGetCurrentUser.mockRejectedValue(error);
      
      const store = useUserInfoStore.getState();
      
      // Set userInfo first
      act(() => {
        store.initialize();
      });
      mockedUserInfoService.load.mockReturnValue(mockUserInfo);
      
      await act(async () => {
        await store.loadUserInfo();
      });

      const state = useUserInfoStore.getState();
      expect(state.userInfo).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(mockedUserInfoService.clear).toHaveBeenCalled();
    });
  });

  describe('clearUserInfo', () => {
    it('should clear userInfo from state and localStorage', () => {
      mockedUserInfoService.load.mockReturnValue(mockUserInfo);
      
      const store = useUserInfoStore.getState();
      
      // Initialize with userInfo
      act(() => {
        store.initialize();
      });
      
      expect(useUserInfoStore.getState().userInfo).toEqual(mockUserInfo);

      // Clear userInfo
      act(() => {
        store.clearUserInfo();
      });

      const state = useUserInfoStore.getState();
      expect(state.userInfo).toBeNull();
      expect(mockedUserInfoService.clear).toHaveBeenCalled();
    });
  });

  describe('refreshUserInfo', () => {
    it('should call loadUserInfo to refresh user info', async () => {
      mockedGetCurrentUser.mockResolvedValue(mockUserInfo);
      
      const store = useUserInfoStore.getState();
      
      await act(async () => {
        await store.refreshUserInfo();
      });

      expect(mockedGetCurrentUser).toHaveBeenCalled();
      const state = useUserInfoStore.getState();
      expect(state.userInfo).toEqual(mockUserInfo);
    });
  });
});


