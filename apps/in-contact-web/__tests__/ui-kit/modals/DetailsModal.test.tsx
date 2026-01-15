import React from 'react';
import { render, screen } from '@testing-library/react';
import { DetailsModal } from '@/ui-kit/modals/DetailsModal';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('@/ui-kit/modals/BaseModal', () => ({
  BaseModal: ({ open, children, className, customHeader }: { open: boolean; children: React.ReactNode; className?: string; customHeader?: React.ReactNode }) => (
    open ? <div data-testid="base-modal" className={className}>{customHeader}{children}</div> : null
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalHeader', () => ({
  ModalHeader: ({ title, iconSrc, iconAlt, onClose, actions }: any) => (
    <div>
      <span>{title}</span>
      {iconSrc && <img src={iconSrc} alt={iconAlt} />}
      {actions}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalBody', () => ({
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('DetailsModal', () => {
  it('should not render when open is false', () => {
    render(
      <DetailsModal
        open={false}
        title="Details"
        onClose={jest.fn()}
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <DetailsModal
        open={true}
        title="Details"
        onClose={jest.fn()}
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    expect(screen.getByTestId('base-modal')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render with icon when iconSrc is provided', () => {
    render(
      <DetailsModal
        open={true}
        title="Details"
        iconSrc="/icon.png"
        iconAlt="Icon"
        onClose={jest.fn()}
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    const img = screen.getByAltText('Icon');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
  });

  it('should render header actions when provided', () => {
    render(
      <DetailsModal
        open={true}
        title="Details"
        onClose={jest.fn()}
        headerActions={<button>Copy</button>}
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('should apply default maxWidth', () => {
    const { container } = render(
      <DetailsModal
        open={true}
        title="Details"
        onClose={jest.fn()}
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('max-w-4xl');
  });

  it('should apply custom maxWidth', () => {
    const { container } = render(
      <DetailsModal
        open={true}
        title="Details"
        onClose={jest.fn()}
        maxWidth="max-w-2xl"
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('max-w-2xl');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DetailsModal
        open={true}
        title="Details"
        onClose={jest.fn()}
        className="custom-class"
      >
        <div>Content</div>
      </DetailsModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('custom-class');
  });
});


