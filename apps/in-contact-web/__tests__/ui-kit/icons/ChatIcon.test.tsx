import React from 'react';
import { render } from '@testing-library/react';
import { ChatIcon } from '@/ui-kit/icons/ChatIcon';

describe('ChatIcon', () => {
  it('should render the chat icon', () => {
    const { container } = render(<ChatIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default className', () => {
    const { container } = render(<ChatIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-6', 'h-6');
  });

  it('should apply custom className', () => {
    const { container } = render(<ChatIcon className="w-8 h-8" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-8', 'h-8');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<ChatIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should have aria-hidden attribute', () => {
    const { container } = render(<ChatIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});


