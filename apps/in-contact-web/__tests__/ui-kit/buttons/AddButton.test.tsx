import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddButton } from '@/ui-kit/buttons/AddButton';

jest.mock('@/ui-kit/icons', () => ({
  PlusIcon: ({ className }: { className?: string }) => (
    <svg data-testid="plus-icon" className={className}>+</svg>
  ),
}));

describe('AddButton', () => {
  it('should render the button with label', () => {
    const onClick = jest.fn();
    render(<AddButton label="Add Item" onClick={onClick} />);
    
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<AddButton label="Add" onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<AddButton label="Add" onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<AddButton label="Add" onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render PlusIcon', () => {
    const onClick = jest.fn();
    render(<AddButton label="Add" onClick={onClick} />);
    
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });
});



