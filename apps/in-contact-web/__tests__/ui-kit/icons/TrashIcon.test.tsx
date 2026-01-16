import React from 'react';
import { render } from '@testing-library/react';
import { TrashIcon } from '@/ui-kit/icons/TrashIcon';

describe('TrashIcon', () => {
  it('should render the trash icon', () => {
    const { container } = render(<TrashIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default size', () => {
    const { container } = render(<TrashIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '1.5rem', height: '1.5rem' });
  });

  it('should apply custom size', () => {
    const { container } = render(<TrashIcon size="2rem" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '2rem', height: '2rem' });
  });

  it('should apply custom className', () => {
    const { container } = render(<TrashIcon className="custom-class" />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should have correct viewBox', () => {
    const { container } = render(<TrashIcon />);
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});



