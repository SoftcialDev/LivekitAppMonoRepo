import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconWithLabel } from '@/ui-kit/icon-with-label/IconWithLabel';

describe('IconWithLabel', () => {
  it('should render icon and label', () => {
    render(
      <IconWithLabel src="/icon.png" alt="Icon">
        Label Text
      </IconWithLabel>
    );
    
    const img = screen.getByAltText('Icon');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
    expect(screen.getByText('Label Text')).toBeInTheDocument();
  });

  it('should apply default alt text when not provided', () => {
    render(
      <IconWithLabel src="/icon.png">
        Label
      </IconWithLabel>
    );
    
    const img = screen.getByAltText('Icon');
    expect(img).toBeInTheDocument();
  });

  it('should apply default imgSize', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png">
        Label
      </IconWithLabel>
    );
    
    const img = container.querySelector('img');
    expect(img).toHaveClass('h-8', 'sm:h-10', 'md:h-12');
  });

  it('should apply custom imgSize', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png" imgSize="w-6 h-6">
        Label
      </IconWithLabel>
    );
    
    const img = container.querySelector('img');
    expect(img).toHaveClass('w-6', 'h-6');
  });

  it('should apply default textSize', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png">
        Label
      </IconWithLabel>
    );
    
    const span = container.querySelector('span');
    expect(span).toHaveClass('text-xl', 'sm:text-2xl', 'md:text-3xl');
  });

  it('should apply custom textSize', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png" textSize="text-lg">
        Label
      </IconWithLabel>
    );
    
    const span = container.querySelector('span');
    expect(span).toHaveClass('text-lg');
  });

  it('should apply fillContainer classes when fillContainer is true', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png" fillContainer>
        Label
      </IconWithLabel>
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full', 'h-full');
  });

  it('should not apply fillContainer classes when fillContainer is false', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png" fillContainer={false}>
        Label
      </IconWithLabel>
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('w-full', 'h-full');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png" className="custom-class">
        Label
      </IconWithLabel>
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should apply default className', () => {
    const { container } = render(
      <IconWithLabel src="/icon.png">
        Label
      </IconWithLabel>
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'whitespace-nowrap', 'mb-6', 'mt-8');
  });
});

