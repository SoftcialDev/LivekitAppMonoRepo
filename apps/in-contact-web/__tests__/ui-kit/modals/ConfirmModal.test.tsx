import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '@/ui-kit/modals/ConfirmModal';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('@/ui-kit/modals/components/ModalHeader', () => ({
  ModalHeader: ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div>
      <span>{title}</span>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalFooter', () => ({
  ModalFooter: ({
    onCancel,
    onConfirm,
    confirmLabel,
    cancelLabel,
    confirmDisabled,
  }: {
    onCancel?: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmDisabled?: boolean;
  }) => (
    <div>
      {cancelLabel && onCancel && (
        <button onClick={onCancel}>{cancelLabel}</button>
      )}
      <button onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </button>
    </div>
  ),
}));

jest.mock('@/ui-kit/modals/components/ModalBody', () => ({
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ConfirmModal', () => {
  it('should not render when open is false', () => {
    render(
      <ConfirmModal
        open={false}
        title="Confirm"
        message="Are you sure?"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
  });

  it('should render when open is true', () => {
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Are you sure?"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Are you sure?"
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Are you sure?"
        onClose={onClose}
        onConfirm={jest.fn()}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should use custom button labels', () => {
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Are you sure?"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        confirmLabel="Yes"
        cancelLabel="No"
      />
    );
    
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should disable confirm button when confirmDisabled is true', () => {
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Are you sure?"
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        confirmDisabled={true}
      />
    );
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });
});

