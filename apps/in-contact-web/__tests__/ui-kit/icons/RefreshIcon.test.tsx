import React from 'react';
import { render } from '@testing-library/react';
import { RefreshIcon } from '@/ui-kit/icons/RefreshIcon';

describe('RefreshIcon', () => {
  it('should render the refresh icon', () => {
    const { container } = render(<RefreshIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default size', () => {
    const { container } = render(<RefreshIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
  });

  it('should apply custom size', () => {
    const { container } = render(<RefreshIcon size={24} />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('should apply custom className', () => {
    const { container } = render(<RefreshIcon className="custom-class" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<RefreshIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0,0,256,256');
  });
});


