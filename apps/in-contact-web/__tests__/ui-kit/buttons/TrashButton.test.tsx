import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrashButton } from '@/ui-kit/buttons/TrashButton';

jest.mock('@/ui-kit/icons', () => ({
  TrashIcon: ({ className }: { className?: string }) => (
    <svg data-testid="trash-icon" className={className}>🗑️</svg>
  ),
}));

describe('TrashButton', () => {
  it('should render the trash button', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Delete');
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should use custom title when provided', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} title="Remove item" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Remove item');
  });

  it('should apply custom className', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should be disabled when isLoading is true', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} isLoading />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading spinner when isLoading is true', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} isLoading />);
    
    const spinner = screen.getByRole('button').querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
  });

  it('should show trash icon when not loading', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} isLoading={false} />);
    
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<TrashButton onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });
});



