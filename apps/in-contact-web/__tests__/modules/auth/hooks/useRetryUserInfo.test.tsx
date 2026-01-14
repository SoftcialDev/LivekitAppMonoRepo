import { renderHook, act, waitFor } from '@testing-library/react';
import { useRetryUserInfo } from '@/modules/auth/hooks/useRetryUserInfo';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useUserInfoStore } from '@/modules/auth/stores/user-info-store/useUserInfoStore';
import { setTokenGetter } from '@/shared/api/apiClient';
import { RETRY_INTERVAL_MS, MAX_RETRY_ATTEMPTS } from '@/modules/auth/pages/constants';

// Mock dependencies
jest.mock('@/modules/auth/hooks/useAuth');
jest.mock('@/modules/auth/stores/user-info-store/useUserInfoStore');
jest.mock('@/shared/api/apiClient', () => ({
  setTokenGetter: jest.fn(),
}));
jest.mock('@/shared/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseUserInfoStore = useUserInfoStore as jest.MockedFunction<typeof useUserInfoStore>;
const mockedSetTokenGetter = setTokenGetter as jest.MockedFunction<typeof setTokenGetter>;

describe('useRetryUserInfo', () => {
  const mockAccount = {
    homeAccountId: 'test-home-id',
    localAccountId: 'test-local-id',
    environment: 'test-env',
    tenantId: 'test-tenant-id',
    username: 'test@example.com',
  };

  const mockGetApiToken = jest.fn();
  const mockLoadUserInfo = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockedUseAuth.mockReturnValue({
      account: mockAccount,
      initialized: true,
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
      getApiToken: mockGetApiToken,
      refreshRoles: jest.fn(),
    });

    (useUserInfoStore.getState as jest.Mock) = jest.fn(() => ({
      loadUserInfo: mockLoadUserInfo,
    }));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRetryUserInfo());

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.hasFailed).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.retryLoadUserInfo).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should set isRetrying to true when retryLoadUserInfo starts', async () => {
    mockLoadUserInfo.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    expect(result.current.isRetrying).toBe(true);
    expect(result.current.hasFailed).toBe(false);

    await act(async () => {
      await mockLoadUserInfo();
      jest.advanceTimersByTime(0);
    });
  });

  it('should set token getter when account is available', async () => {
    mockLoadUserInfo.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    await act(async () => {
      await mockLoadUserInfo();
      jest.advanceTimersByTime(0);
    });

    expect(mockedSetTokenGetter).toHaveBeenCalledWith(mockGetApiToken);
  });

  it('should successfully load user info on first attempt', async () => {
    mockLoadUserInfo.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRetryUserInfo());

    await act(async () => {
      await result.current.retryLoadUserInfo();
      jest.advanceTimersByTime(0);
    });

    expect(mockLoadUserInfo).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.hasFailed).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
  });

  it('should retry on failure after RETRY_INTERVAL_MS', async () => {
    const error = new Error('Load failed');
    mockLoadUserInfo.mockRejectedValue(error);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    // First attempt fails
    await act(async () => {
      await mockLoadUserInfo().catch(() => {});
      jest.advanceTimersByTime(0);
    });

    // Wait for retry interval
    await act(async () => {
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
    });

    // Should have retried
    expect(mockLoadUserInfo).toHaveBeenCalledTimes(2);
  });

  it('should stop retrying after MAX_RETRY_ATTEMPTS', async () => {
    const error = new Error('Load failed');
    mockLoadUserInfo.mockRejectedValue(error);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    // Simulate all retry attempts
    for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
      await act(async () => {
        await mockLoadUserInfo().catch(() => {});
        jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      });
    }

    expect(result.current.hasFailed).toBe(true);
    expect(result.current.isRetrying).toBe(false);
    expect(mockLoadUserInfo).toHaveBeenCalledTimes(MAX_RETRY_ATTEMPTS);
  });

  it('should stop retrying after 1 minute even if attempts remain', async () => {
    const error = new Error('Load failed');
    mockLoadUserInfo.mockRejectedValue(error);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    // Advance time to exceed max retry time (60000ms)
    await act(async () => {
      await mockLoadUserInfo().catch(() => {});
      jest.advanceTimersByTime(60001);
    });

    expect(result.current.hasFailed).toBe(true);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should prevent multiple concurrent retry attempts', async () => {
    mockLoadUserInfo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
      result.current.retryLoadUserInfo(); // Call again immediately
    });

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    // Should only be called once
    expect(mockLoadUserInfo).toHaveBeenCalledTimes(1);
  });

  it('should reset state when reset is called', async () => {
    const error = new Error('Load failed');
    mockLoadUserInfo.mockRejectedValue(error);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    await act(async () => {
      await mockLoadUserInfo().catch(() => {});
      jest.advanceTimersByTime(0);
    });

    expect(result.current.isRetrying).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.hasFailed).toBe(false);
    expect(result.current.currentAttempt).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should cleanup timeout on unmount', async () => {
    const error = new Error('Load failed');
    mockLoadUserInfo.mockRejectedValue(error);

    const { result, unmount } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    await act(async () => {
      await mockLoadUserInfo().catch(() => {});
      jest.advanceTimersByTime(0);
    });

    unmount();

    // Advance time - should not trigger retry after unmount
    await act(async () => {
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
    });

    // Should still only have initial attempt
    expect(mockLoadUserInfo).toHaveBeenCalledTimes(1);
  });

  it('should update currentAttempt on each retry', async () => {
    const error = new Error('Load failed');
    mockLoadUserInfo.mockRejectedValue(error);

    const { result } = renderHook(() => useRetryUserInfo());

    act(() => {
      result.current.retryLoadUserInfo();
    });

    // First failure
    await act(async () => {
      await mockLoadUserInfo().catch(() => {});
      jest.advanceTimersByTime(0);
    });

    expect(result.current.currentAttempt).toBe(1);

    // Second failure
    await act(async () => {
      jest.advanceTimersByTime(RETRY_INTERVAL_MS);
      await mockLoadUserInfo().catch(() => {});
    });

    expect(result.current.currentAttempt).toBe(2);
  });
});

