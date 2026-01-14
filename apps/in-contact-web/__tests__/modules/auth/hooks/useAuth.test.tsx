import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { AuthContext } from '@/modules/auth/contexts/AuthContext';
import { ContextError } from '@/shared/errors';
import type { AccountInfo } from '@azure/msal-browser';

// Mock useContext
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

const mockedUseContext = useContext as jest.MockedFunction<typeof useContext>;

describe('useAuth', () => {
  const mockAccount: AccountInfo = {
    homeAccountId: 'test-home-id',
    localAccountId: 'test-local-id',
    environment: 'test-env',
    tenantId: 'test-tenant-id',
    username: 'test@example.com',
    name: 'Test User',
  };

  const mockContextValue = {
    account: mockAccount,
    initialized: true,
    login: jest.fn(),
    logout: jest.fn(),
    getApiToken: jest.fn(),
    refreshRoles: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return context value when context is available', () => {
    mockedUseContext.mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());

    expect(result.current.account).toEqual(mockAccount);
    expect(result.current.initialized).toBe(true);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.login).toBe(mockContextValue.login);
    expect(result.current.logout).toBe(mockContextValue.logout);
    expect(result.current.getApiToken).toBe(mockContextValue.getApiToken);
    expect(result.current.refreshRoles).toBe(mockContextValue.refreshRoles);
  });

  it('should set isLoggedIn to false when account is null', () => {
    mockedUseContext.mockReturnValue({
      ...mockContextValue,
      account: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.account).toBeNull();
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('should set isLoggedIn to true when account exists', () => {
    mockedUseContext.mockReturnValue({
      ...mockContextValue,
      account: mockAccount,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoggedIn).toBe(true);
  });

  it('should throw ContextError when context is null', () => {
    mockedUseContext.mockReturnValue(null);

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow(ContextError);
  });

  it('should throw ContextError with appropriate message when context is null', () => {
    mockedUseContext.mockReturnValue(null);

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should return all context methods', () => {
    mockedUseContext.mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.getApiToken).toBe('function');
    expect(typeof result.current.refreshRoles).toBe('function');
  });
});

