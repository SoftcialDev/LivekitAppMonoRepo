import React from 'react';
import { render } from '@testing-library/react';
import { CancelIcon } from '@/ui-kit/icons/CancelIcon';

describe('CancelIcon', () => {
  it('should render the cancel icon', () => {
    const { container } = render(<CancelIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default className', () => {
    const { container } = render(<CancelIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-7', 'h-7');
  });

  it('should apply custom className', () => {
    const { container } = render(<CancelIcon className="w-5 h-5" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-5', 'h-5');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<CancelIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
  });
});

