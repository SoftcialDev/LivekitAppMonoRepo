import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BaseModal } from '@/ui-kit/modals/BaseModal';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('BaseModal', () => {
  it('should not render when open is false', () => {
    render(
      <BaseModal open={false} onClose={jest.fn()}>
        <div>Modal Content</div>
      </BaseModal>
    );
    
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <BaseModal open={true} onClose={jest.fn()}>
        <div>Modal Content</div>
      </BaseModal>
    );
    
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <BaseModal open={true} onClose={onClose}>
        <div>Modal Content</div>
      </BaseModal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <BaseModal open={true} onClose={onClose}>
        <div>Modal Content</div>
      </BaseModal>
    );
    
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render custom header when provided', () => {
    render(
      <BaseModal
        open={true}
        onClose={jest.fn()}
        customHeader={<div>Custom Header</div>}
      >
        <div>Modal Content</div>
      </BaseModal>
    );
    
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });

  it('should render custom footer when provided', () => {
    render(
      <BaseModal
        open={true}
        onClose={jest.fn()}
        customFooter={<div>Custom Footer</div>}
      >
        <div>Modal Content</div>
      </BaseModal>
    );
    
    expect(screen.getByText('Custom Footer')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <BaseModal open={true} onClose={jest.fn()} className="custom-class">
        <div>Modal Content</div>
      </BaseModal>
    );
    
    const modal = container.querySelector('.custom-class');
    expect(modal).toBeInTheDocument();
  });
});


