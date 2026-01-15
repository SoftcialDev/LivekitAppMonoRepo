import React from 'react';
import { render, screen } from '@testing-library/react';
import { PreviewModal } from '@/ui-kit/modals/PreviewModal';

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
  ModalHeader: ({ title, iconSrc, iconAlt, onClose }: any) => (
    <div>
      <span>{title}</span>
      {iconSrc && <img src={iconSrc} alt={iconAlt} />}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalBody', () => ({
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PreviewModal', () => {
  it('should not render when open is false', () => {
    render(
      <PreviewModal
        open={false}
        title="Preview"
        onClose={jest.fn()}
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <PreviewModal
        open={true}
        title="Preview"
        onClose={jest.fn()}
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    expect(screen.getByTestId('base-modal')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByAltText('Preview')).toBeInTheDocument();
  });

  it('should render with icon when iconSrc is provided', () => {
    render(
      <PreviewModal
        open={true}
        title="Preview"
        iconSrc="/icon.png"
        iconAlt="Icon"
        onClose={jest.fn()}
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    const img = screen.getByAltText('Icon');
    expect(img).toBeInTheDocument();
  });

  it('should apply default maxWidth', () => {
    const { container } = render(
      <PreviewModal
        open={true}
        title="Preview"
        onClose={jest.fn()}
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('w-[90vw]', 'max-w-6xl');
  });

  it('should apply custom maxWidth', () => {
    const { container } = render(
      <PreviewModal
        open={true}
        title="Preview"
        onClose={jest.fn()}
        maxWidth="max-w-4xl"
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('max-w-4xl');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PreviewModal
        open={true}
        title="Preview"
        onClose={jest.fn()}
        className="custom-class"
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('custom-class');
  });

  it('should render children in centered container', () => {
    const { container } = render(
      <PreviewModal
        open={true}
        title="Preview"
        onClose={jest.fn()}
      >
        <img src="/preview.jpg" alt="Preview" />
      </PreviewModal>
    );
    
    const centeredDiv = container.querySelector('.flex.items-center.justify-center');
    expect(centeredDiv).toBeInTheDocument();
  });
});


