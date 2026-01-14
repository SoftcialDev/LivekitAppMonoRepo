import React from 'react';
import { render } from '@testing-library/react';
import { SignInIcon } from '@/ui-kit/icons/SignInIcon';

describe('SignInIcon', () => {
  it('should render the sign in icon', () => {
    const { container } = render(<SignInIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default size', () => {
    const { container } = render(<SignInIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '1em', height: '1em' });
  });

  it('should apply custom size', () => {
    const { container } = render(<SignInIcon size="2rem" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '2rem', height: '2rem' });
  });

  it('should apply custom className', () => {
    const { container } = render(<SignInIcon className="custom-class" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<SignInIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});

