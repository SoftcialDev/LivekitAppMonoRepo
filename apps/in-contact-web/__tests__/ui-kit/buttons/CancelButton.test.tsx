import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CancelButton } from '@/ui-kit/buttons/CancelButton';

jest.mock('@/ui-kit/icons', () => ({
  CancelIcon: () => <svg data-testid="cancel-icon">×</svg>,
}));

describe('CancelButton', () => {
  it('should render the button with default label', () => {
    const onClick = jest.fn();
    render(<CancelButton onClick={onClick} />);
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render the button with custom label', () => {
    const onClick = jest.fn();
    render(<CancelButton onClick={onClick} label="Close" />);
    
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<CancelButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<CancelButton onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<CancelButton onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render CancelIcon', () => {
    const onClick = jest.fn();
    render(<CancelButton onClick={onClick} />);
    
    expect(screen.getByTestId('cancel-icon')).toBeInTheDocument();
  });
});

