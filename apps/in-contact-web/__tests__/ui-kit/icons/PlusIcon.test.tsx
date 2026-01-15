import React from 'react';
import { render } from '@testing-library/react';
import { PlusIcon } from '@/ui-kit/icons/PlusIcon';

describe('PlusIcon', () => {
  it('should render the plus icon', () => {
    const { container } = render(<PlusIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default className', () => {
    const { container } = render(<PlusIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-10', 'h-10');
  });

  it('should apply custom className', () => {
    const { container } = render(<PlusIcon className="w-6 h-6" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-6', 'h-6');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<PlusIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});


