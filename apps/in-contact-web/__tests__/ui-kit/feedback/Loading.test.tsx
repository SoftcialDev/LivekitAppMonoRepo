import React from 'react';
import { render, screen } from '@testing-library/react';
import { Loading } from '@/ui-kit/feedback/Loading';

describe('Loading', () => {
  it('should render loading spinner and default text', () => {
    render(<Loading action="loading data" />);
    
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Please wait while system loading data';
    })).toBeInTheDocument();
  });

  it('should display custom action message', () => {
    render(<Loading action="processing request" />);
    
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Please wait while system processing request';
    })).toBeInTheDocument();
  });

  it('should apply custom bgClassName', () => {
    const { container } = render(<Loading action="loading" bgClassName="custom-bg" />);
    
    const loadingDiv = container.firstChild as HTMLElement;
    expect(loadingDiv).toHaveClass('custom-bg');
  });

  it('should render spinner SVG', () => {
    const { container } = render(<Loading action="loading" />);
    
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

