import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormModal } from '@/ui-kit/modals/FormModal';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('@/ui-kit/modals/BaseModal', () => ({
  BaseModal: ({ open, children, className, customHeader, customFooter }: { open: boolean; children: React.ReactNode; className?: string; customHeader?: React.ReactNode; customFooter?: React.ReactNode }) => (
    open ? <div data-testid="base-modal" className={className}>{customHeader}{children}{customFooter}</div> : null
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalHeader', () => ({
  ModalHeader: ({ title, onClose }: any) => (
    <div>
      <span>{title}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalBody', () => ({
  ModalBody: ({ children, loading, loadingAction }: any) => (
    <div>
      {loading && <div>Loading: {loadingAction}</div>}
      {children}
    </div>
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalFooter', () => ({
  ModalFooter: ({ onCancel, onConfirm, confirmLabel, cancelLabel, confirmDisabled }: any) => (
    <div>
      {cancelLabel && <button onClick={onCancel}>{cancelLabel}</button>}
      <button onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</button>
    </div>
  ),
}));

describe('FormModal', () => {
  it('should not render when open is false', () => {
    render(
      <FormModal
        open={false}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    expect(screen.queryByTestId('base-modal')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    expect(screen.getByTestId('base-modal')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('should call onSubmit when submit button is clicked', () => {
    const onSubmit = jest.fn();
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={onSubmit}
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={onClose}
        onSubmit={jest.fn()}
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should use custom button labels', () => {
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        submitLabel="Save"
        cancelLabel="Close"
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should show loading state when loading is true', () => {
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        loading={true}
        loadingAction="Saving..."
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    expect(screen.getByText('Loading: Saving...')).toBeInTheDocument();
  });

  it('should disable submit button when submitDisabled is true', () => {
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        submitDisabled={true}
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeDisabled();
  });

  it('should disable submit button when loading is true', () => {
    render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        loading={true}
      >
        <div>Form Content</div>
      </FormModal>
    );
    
    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeDisabled();
  });

  it('should apply default maxWidth', () => {
    const { container } = render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      >
        <div>Content</div>
      </FormModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('w-[600px]', 'max-w-[90vw]');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormModal
        open={true}
        title="Form"
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        className="custom-class"
      >
        <div>Content</div>
      </FormModal>
    );
    
    const modal = container.querySelector('[data-testid="base-modal"]');
    expect(modal).toHaveClass('custom-class');
  });
});

