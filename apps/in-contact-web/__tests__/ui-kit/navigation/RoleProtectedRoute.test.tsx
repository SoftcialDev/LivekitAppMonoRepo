import { render, screen } from '@testing-library/react';
import { RoleProtectedRoute } from '@/ui-kit/navigation/RoleProtectedRoute';
import { useAuth, useUserInfo } from '@/modules/auth';
import { UserRole } from '@/modules/auth/enums';
import { Loading } from '@/ui-kit/feedback';

jest.mock('@/modules/auth', () => ({
  useAuth: jest.fn(),
  useUserInfo: jest.fn(),
}));

jest.mock('@/modules/auth/enums', () => ({
  UserRole: {
    Admin: 'Admin',
    Supervisor: 'Supervisor',
    PSO: 'PSO',
    ContactManager: 'ContactManager',
    SuperAdmin: 'SuperAdmin',
  },
}));

jest.mock('@/ui-kit/feedback', () => ({
  Loading: ({ action }: { action: string }) => <div>Loading: {action}</div>,
}));

jest.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>Navigate to: {to}</div>,
}));

describe('RoleProtectedRoute', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseUserInfo = useUserInfo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to login when not initialized', () => {
    mockUseAuth.mockReturnValue({
      account: null,
      initialized: false,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: null,
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('should redirect to login when account is null', () => {
    mockUseAuth.mockReturnValue({
      account: null,
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: null,
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('should redirect to loading when userInfo is not loaded and not loading', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: null,
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /loading')).toBeInTheDocument();
  });

  it('should show loading when userInfo is loading', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: null,
      isLoading: true,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Loading: is loading your user information')).toBeInTheDocument();
  });

  it('should render children when user role is in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Admin },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Supervisor]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect when user role is not in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.PSO },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psosDashboard')).toBeInTheDocument();
  });

  it('should redirect PSO to psosDashboard when access denied', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.PSO },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psosDashboard')).toBeInTheDocument();
  });

  it('should redirect Admin to psos-streaming when access denied', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Admin },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.PSO]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });

  it('should redirect Supervisor to psos-streaming when access denied', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Supervisor },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.PSO]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });

  it('should redirect SuperAdmin to psos-streaming when access denied', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.SuperAdmin },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.PSO]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });

  it('should redirect ContactManager to contactManagerDashboard when access denied', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.ContactManager },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /contactManagerDashboard')).toBeInTheDocument();
  });

  it('should redirect to login when role is null or undefined', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: null },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('should redirect to login when role is undefined', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: undefined },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('should handle multiple allowed roles', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Supervisor },
      isLoading: false,
    });

    render(
      <RoleProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Supervisor, UserRole.SuperAdmin]}>
        <div>Protected Content</div>
      </RoleProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

