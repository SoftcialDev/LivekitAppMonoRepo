import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { usePresence } from '@/modules/presence';
import { useSidebar } from '@/modules/sidebar';

jest.mock('@/modules/presence', () => ({
  usePresence: jest.fn(),
}));

jest.mock('@/modules/sidebar', () => ({
  useSidebar: jest.fn(),
  Sidebar: ({ onlineUsers, offlineUsers, isCollapsed, onToggleCollapse }: any) => (
    <div data-testid="sidebar">
      <div>Sidebar - Collapsed: {isCollapsed ? 'true' : 'false'}</div>
      <div>Online: {onlineUsers.length}</div>
      <div>Offline: {offlineUsers.length}</div>
      <button onClick={onToggleCollapse}>Toggle</button>
    </div>
  ),
  SidebarToggle: ({ isCollapsed, onToggle }: any) => (
    <button data-testid="sidebar-toggle" onClick={onToggle}>
      Toggle - {isCollapsed ? 'Collapsed' : 'Expanded'}
    </button>
  ),
}));

jest.mock('@/ui-kit/layout', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet</div>,
}));

describe('DashboardLayout', () => {
  const mockUsePresence = usePresence as jest.Mock;
  const mockUseSidebar = useSidebar as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePresence.mockReturnValue({
      onlineUsers: [],
      offlineUsers: [],
    });
    mockUseSidebar.mockReturnValue({
      isCollapsed: false,
      toggleCollapse: jest.fn(),
    });
  });

  it('should render sidebar, header, and outlet', () => {
    render(<DashboardLayout />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should pass online and offline users to sidebar', () => {
    const onlineUsers = [{ email: 'user1@example.com' }];
    const offlineUsers = [{ email: 'user2@example.com' }];

    mockUsePresence.mockReturnValue({
      onlineUsers,
      offlineUsers,
    });

    render(<DashboardLayout />);

    expect(screen.getByText('Online: 1')).toBeInTheDocument();
    expect(screen.getByText('Offline: 1')).toBeInTheDocument();
  });

  it('should pass collapsed state to sidebar', () => {
    mockUseSidebar.mockReturnValue({
      isCollapsed: true,
      toggleCollapse: jest.fn(),
    });

    render(<DashboardLayout />);

    expect(screen.getByText('Sidebar - Collapsed: true')).toBeInTheDocument();
  });

  it('should pass toggle function to sidebar', () => {
    const mockToggleCollapse = jest.fn();
    mockUseSidebar.mockReturnValue({
      isCollapsed: false,
      toggleCollapse: mockToggleCollapse,
    });

    render(<DashboardLayout />);

    const toggleButton = screen.getByText('Toggle');
    toggleButton.click();

    expect(mockToggleCollapse).toHaveBeenCalled();
  });

  it('should position sidebar toggle correctly when collapsed', () => {
    mockUseSidebar.mockReturnValue({
      isCollapsed: true,
      toggleCollapse: jest.fn(),
    });

    const { container } = render(<DashboardLayout />);
    const toggle = container.querySelector('[data-testid="sidebar-toggle"]');
    const parent = toggle?.parentElement;

    expect(parent).toHaveClass('left-0');
  });

  it('should position sidebar toggle correctly when expanded', () => {
    mockUseSidebar.mockReturnValue({
      isCollapsed: false,
      toggleCollapse: jest.fn(),
    });

    const { container } = render(<DashboardLayout />);
    const toggle = container.querySelector('[data-testid="sidebar-toggle"]');
    const parent = toggle?.parentElement;

    expect(parent).toHaveClass('left-[350px]');
  });
});

