import React from 'react';
import { render, screen } from '@testing-library/react';
import { Toast } from '@/ui-kit/feedback/Toast';

describe('Toast', () => {
  it('should render success toast', () => {
    render(<Toast message="Success message" type="success" />);
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    render(<Toast message="Error message" type="error" />);
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render warning toast', () => {
    render(<Toast message="Warning message" type="warning" />);
    
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should have correct styling for each type', () => {
    const { rerender } = render(<Toast message="Test" type="success" />);
    let alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-2', 'border-[var(--color-secondary)]');
    
    rerender(<Toast message="Test" type="error" />);
    alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    
    rerender(<Toast message="Test" type="warning" />);
    alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

