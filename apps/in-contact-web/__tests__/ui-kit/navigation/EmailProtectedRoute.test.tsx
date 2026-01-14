import { render, screen } from '@testing-library/react';
import { EmailProtectedRoute } from '@/ui-kit/navigation/EmailProtectedRoute';
import { useAuth, useUserInfo, UserRole } from '@/modules/auth';
import { Loading } from '@/ui-kit/feedback';

jest.mock('@/modules/auth', () => ({
  useAuth: jest.fn(),
  useUserInfo: jest.fn(),
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

describe('EmailProtectedRoute', () => {
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
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
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
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
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
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
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
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Loading: is loading your user information')).toBeInTheDocument();
  });

  it('should render children when email matches pattern', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'test.user@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Admin },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect PSO to psosDashboard when email does not match', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'other@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.PSO },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psosDashboard')).toBeInTheDocument();
  });

  it('should redirect Admin to psos-streaming when email does not match', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'other@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Admin },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });

  it('should redirect Supervisor to psos-streaming when email does not match', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'other@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Supervisor },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });

  it('should redirect SuperAdmin to psos-streaming when email does not match', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'other@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.SuperAdmin },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });

  it('should redirect ContactManager to contactManagerDashboard when email does not match', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'other@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.ContactManager },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /contactManagerDashboard')).toBeInTheDocument();
  });

  it('should redirect to login when role is unknown and email does not match', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'other@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: 'Unknown' as UserRole },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /login')).toBeInTheDocument();
  });

  it('should match email pattern case-insensitively', () => {
    mockUseAuth.mockReturnValue({
      account: { username: 'TEST.USER@example.com' },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Admin },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle empty username', () => {
    mockUseAuth.mockReturnValue({
      account: { username: undefined },
      initialized: true,
    });
    mockUseUserInfo.mockReturnValue({
      userInfo: { role: UserRole.Admin },
      isLoading: false,
    });

    render(
      <EmailProtectedRoute emailPattern="test">
        <div>Protected Content</div>
      </EmailProtectedRoute>
    );

    expect(screen.getByText('Navigate to: /psos-streaming')).toBeInTheDocument();
  });
});

