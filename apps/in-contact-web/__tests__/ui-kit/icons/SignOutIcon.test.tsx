import React from 'react';
import { render } from '@testing-library/react';
import { SignOutIcon } from '@/ui-kit/icons/SignOutIcon';

describe('SignOutIcon', () => {
  it('should render the sign out icon', () => {
    const { container } = render(<SignOutIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default size', () => {
    const { container } = render(<SignOutIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '1.75rem', height: '1.75rem' });
  });

  it('should apply custom size', () => {
    const { container } = render(<SignOutIcon size="2rem" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '2rem', height: '2rem' });
  });

  it('should apply custom className', () => {
    const { container } = render(<SignOutIcon className="custom-class" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<SignOutIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});



