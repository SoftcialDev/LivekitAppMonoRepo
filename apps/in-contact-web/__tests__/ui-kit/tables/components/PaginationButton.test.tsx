import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationButton } from '@/ui-kit/tables/components/PaginationButton';

describe('PaginationButton', () => {
  it('should render button with label', () => {
    const onClick = jest.fn();
    render(<PaginationButton label="Next" onClick={onClick} />);
    
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<PaginationButton label="Next" onClick={onClick} />);
    
    const button = screen.getByText('Next');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<PaginationButton label="Next" onClick={onClick} disabled />);
    
    const button = screen.getByText('Next');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<PaginationButton label="Next" onClick={onClick} disabled />);
    
    const button = screen.getByText('Next');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should apply disabled styling when disabled', () => {
    const onClick = jest.fn();
    const { container } = render(<PaginationButton label="Next" onClick={onClick} disabled />);
    
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
    // Check that disabled classes are present in className
    const className = button?.className || '';
    expect(className).toContain('opacity-50');
    expect(className).toContain('cursor-not-allowed');
  });

  it('should have correct button type', () => {
    const onClick = jest.fn();
    const { container } = render(<PaginationButton label="Previous" onClick={onClick} />);
    
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('type', 'button');
  });
});

