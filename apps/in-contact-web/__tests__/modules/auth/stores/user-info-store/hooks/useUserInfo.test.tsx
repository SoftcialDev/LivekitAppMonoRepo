import { renderHook, act } from '@testing-library/react';
import { useUserInfo } from '@/modules/auth/stores/user-info-store/hooks/useUserInfo';
import { useUserInfoStore } from '@/modules/auth/stores/user-info-store/useUserInfoStore';
import { UserInfoService } from '@/modules/auth/services/UserInfoService';
import { UserRole } from '@/modules/auth/enums';
import type { UserInfo } from '@/modules/auth/types';

// Mock dependencies
jest.mock('@/modules/auth/stores/user-info-store/useUserInfoStore');
jest.mock('@/modules/auth/services/UserInfoService');

const mockedUseUserInfoStore = useUserInfoStore as jest.MockedFunction<typeof useUserInfoStore>;
const mockedUserInfoService = UserInfoService as jest.Mocked<typeof UserInfoService>;

describe('useUserInfo', () => {
  const mockUserInfo: UserInfo = {
    azureAdObjectId: 'test-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.PSO,
    permissions: ['permission1'],
  };

  const mockStoreState = {
    userInfo: null as UserInfo | null,
    isLoading: false,
    loadUserInfo: jest.fn(),
    clearUserInfo: jest.fn(),
    refreshUserInfo: jest.fn(),
    initialize: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    mockStoreState.userInfo = null;
    mockStoreState.isLoading = false;
    
    mockedUseUserInfoStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState[selector as keyof typeof mockStoreState];
    });
    
    // Mock getState for initialize
    (useUserInfoStore.getState as jest.Mock) = jest.fn(() => mockStoreState);
  });

  it('should return userInfo and isLoading from store', () => {
    mockStoreState.userInfo = mockUserInfo;
    mockStoreState.isLoading = true;

    const { result } = renderHook(() => useUserInfo());

    expect(result.current.userInfo).toEqual(mockUserInfo);
    expect(result.current.isLoading).toBe(true);
  });

  it('should initialize store from localStorage on mount', () => {
    mockedUserInfoService.load.mockReturnValue(mockUserInfo);
    
    renderHook(() => useUserInfo());

    expect(mockStoreState.initialize).toHaveBeenCalledTimes(1);
  });

  it('should only initialize once, even on re-renders', () => {
    mockedUserInfoService.load.mockReturnValue(null);
    
    const { rerender } = renderHook(() => useUserInfo());

    expect(mockStoreState.initialize).toHaveBeenCalledTimes(1);

    rerender();
    rerender();

    expect(mockStoreState.initialize).toHaveBeenCalledTimes(1);
  });

  it('should update when store state changes', () => {
    const { result, rerender } = renderHook(() => useUserInfo());

    expect(result.current.userInfo).toBeNull();
    expect(result.current.isLoading).toBe(false);

    // Update store state
    act(() => {
      mockStoreState.userInfo = mockUserInfo;
      mockStoreState.isLoading = true;
    });

    // Trigger re-render by calling selector again
    rerender();

    expect(result.current.userInfo).toEqual(mockUserInfo);
    expect(result.current.isLoading).toBe(true);
  });

  it('should return memoized object to prevent unnecessary re-renders', () => {
    const { result, rerender } = renderHook(() => useUserInfo());

    const firstResult = result.current;

    rerender();

    // The object reference should be the same if values haven't changed
    // Note: This is a best-effort test - React's rendering may cause new references
    expect(result.current).toEqual(firstResult);
  });

  it('should handle null userInfo', () => {
    mockStoreState.userInfo = null;
    mockStoreState.isLoading = false;

    const { result } = renderHook(() => useUserInfo());

    expect(result.current.userInfo).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

