import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/ui-kit/layout/Header';

const mockUseHeaderStore = jest.fn();

jest.mock('@/app/stores', () => ({
  useHeaderStore: (selector: any) => mockUseHeaderStore(selector),
}));

jest.mock('@/ui-kit/layout/IconWithLabel', () => ({
  __esModule: true,
  default: ({ src, alt, children }: { src: string; alt?: string; children: React.ReactNode }) => (
    <div>
      <img src={src} alt={alt} />
      <span>{children}</span>
    </div>
  ),
}));

jest.mock('@/ui-kit/buttons', () => ({
  SignOutButton: () => <button>Sign Out</button>,
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title when provided', () => {
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: 'Dashboard' },
      };
      return selector(state);
    });
    
    render(<Header />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render nothing when title is not provided', () => {
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: '' },
      };
      return selector(state);
    });
    
    const { container } = render(<Header />);
    
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should render IconWithLabel when iconSrc is provided', () => {
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: 'Dashboard', iconSrc: '/icon.png', iconAlt: 'Icon' },
      };
      return selector(state);
    });
    
    render(<Header />);
    
    const img = screen.getByAltText('Icon');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render iconNode when provided', () => {
    const iconNode = <span data-testid="custom-icon">Custom Icon</span>;
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: 'Dashboard', iconNode },
      };
      return selector(state);
    });
    
    render(<Header />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should render title only when no icon', () => {
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: 'Dashboard' },
      };
      return selector(state);
    });
    
    render(<Header />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByAltText('Icon')).not.toBeInTheDocument();
  });

  it('should render SignOutButton', () => {
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: 'Dashboard' },
      };
      return selector(state);
    });
    
    render(<Header />);
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should use title as alt text when iconAlt is not provided', () => {
    mockUseHeaderStore.mockImplementation((selector) => {
      const state = {
        header: { title: 'Dashboard', iconSrc: '/icon.png' },
      };
      return selector(state);
    });
    
    render(<Header />);
    
    const img = screen.getByAltText('Dashboard');
    expect(img).toBeInTheDocument();
  });
});

