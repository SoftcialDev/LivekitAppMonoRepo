import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClearButton } from '@/ui-kit/buttons/ClearButton';

describe('ClearButton', () => {
  it('should render the clear button', () => {
    const onClick = jest.fn();
    render(<ClearButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Clear');
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ClearButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should use custom title when provided', () => {
    const onClick = jest.fn();
    render(<ClearButton onClick={onClick} title="Clear all" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Clear all');
  });

  it('should apply custom className', () => {
    const onClick = jest.fn();
    render(<ClearButton onClick={onClick} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render X icon', () => {
    const onClick = jest.fn();
    render(<ClearButton onClick={onClick} />);
    
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});



