import React from 'react';
import { render } from '@testing-library/react';
import { OfflineIcon } from '@/ui-kit/icons/OfflineIcon';

describe('OfflineIcon', () => {
  it('should render the offline icon', () => {
    const { container } = render(<OfflineIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default className', () => {
    const { container } = render(<OfflineIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-full', 'h-full');
  });

  it('should apply custom className', () => {
    const { container } = render(<OfflineIcon className="w-6 h-6" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-6', 'h-6');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<OfflineIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
  });

  it('should have aria-hidden attribute', () => {
    const { container } = render(<OfflineIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});



