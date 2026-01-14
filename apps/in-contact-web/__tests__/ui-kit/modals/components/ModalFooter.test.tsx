import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalFooter } from '@/ui-kit/modals/components/ModalFooter';

jest.mock('@/ui-kit/buttons', () => ({
  CancelButton: ({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{label}</button>
  ),
  AddButton: ({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{label}</button>
  ),
}));

describe('ModalFooter', () => {
  it('should render confirm button with default label', () => {
    const onConfirm = jest.fn();
    render(<ModalFooter onConfirm={onConfirm} />);
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should render confirm button with custom label', () => {
    const onConfirm = jest.fn();
    render(<ModalFooter onConfirm={onConfirm} confirmLabel="Submit" />);
    
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(<ModalFooter onConfirm={onConfirm} />);
    
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should render cancel button when cancelLabel is provided', () => {
    const onCancel = jest.fn();
    render(<ModalFooter onConfirm={jest.fn()} onCancel={onCancel} cancelLabel="Cancel" />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render cancel button when cancelLabel is not provided', () => {
    render(<ModalFooter onConfirm={jest.fn()} />);
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(<ModalFooter onConfirm={jest.fn()} onCancel={onCancel} cancelLabel="Cancel" />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should disable confirm button when confirmDisabled is true', () => {
    const onConfirm = jest.fn();
    render(<ModalFooter onConfirm={onConfirm} confirmDisabled={true} />);
    
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });

  it('should disable cancel button when cancelDisabled is true', () => {
    const onCancel = jest.fn();
    render(
      <ModalFooter
        onConfirm={jest.fn()}
        onCancel={onCancel}
        cancelLabel="Cancel"
        cancelDisabled={true}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('should render children between buttons', () => {
    render(
      <ModalFooter onConfirm={jest.fn()} cancelLabel="Cancel" onCancel={jest.fn()}>
        <span>Custom Content</span>
      </ModalFooter>
    );
    
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should not render cancel button when cancelLabel is empty string', () => {
    render(<ModalFooter onConfirm={jest.fn()} onCancel={jest.fn()} cancelLabel="" />);
    
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });
});

