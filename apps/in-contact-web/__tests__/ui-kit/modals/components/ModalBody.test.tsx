import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModalBody } from '@/ui-kit/modals/components/ModalBody';

jest.mock('@/ui-kit/feedback', () => ({
  Loading: ({ action }: { action: string }) => <div>Loading: {action}</div>,
}));

describe('ModalBody', () => {
  it('should render children', () => {
    render(
      <ModalBody>
        <div>Test Content</div>
      </ModalBody>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should show loading overlay when loading is true', () => {
    render(
      <ModalBody loading={true} loadingAction="processing">
        <div>Test Content</div>
      </ModalBody>
    );
    
    expect(screen.getByText('Loading: processing')).toBeInTheDocument();
  });

  it('should not show loading overlay when loading is false', () => {
    render(
      <ModalBody loading={false}>
        <div>Test Content</div>
      </ModalBody>
    );
    
    expect(screen.queryByText(/Loading:/)).not.toBeInTheDocument();
  });

  it('should apply default padding', () => {
    const { container } = render(
      <ModalBody>
        <div>Test</div>
      </ModalBody>
    );
    
    const body = container.firstChild as HTMLElement;
    expect(body).toHaveClass('px-6', 'py-2');
  });

  it('should apply custom padding', () => {
    const { container } = render(
      <ModalBody padding="px-4 py-4">
        <div>Test</div>
      </ModalBody>
    );
    
    const body = container.firstChild as HTMLElement;
    expect(body).toHaveClass('px-4', 'py-4');
  });

  it('should apply default text color', () => {
    const { container } = render(
      <ModalBody>
        <div>Test</div>
      </ModalBody>
    );
    
    const body = container.firstChild as HTMLElement;
    expect(body).toHaveClass('text-white');
  });

  it('should apply custom text color', () => {
    const { container } = render(
      <ModalBody textColor="text-gray-200">
        <div>Test</div>
      </ModalBody>
    );
    
    const body = container.firstChild as HTMLElement;
    expect(body).toHaveClass('text-gray-200');
  });

  it('should be scrollable by default', () => {
    const { container } = render(
      <ModalBody>
        <div>Test</div>
      </ModalBody>
    );
    
    const scrollableDiv = container.querySelector('.overflow-y-auto');
    expect(scrollableDiv).toBeInTheDocument();
  });

  it('should not be scrollable when scrollable is false', () => {
    const { container } = render(
      <ModalBody scrollable={false}>
        <div>Test</div>
      </ModalBody>
    );
    
    const scrollableDiv = container.querySelector('.overflow-y-auto');
    expect(scrollableDiv).not.toBeInTheDocument();
  });

  it('should apply custom maxHeight', () => {
    const { container } = render(
      <ModalBody maxHeight="max-h-[80vh]">
        <div>Test</div>
      </ModalBody>
    );
    
    const scrollableDiv = container.querySelector('.max-h-\\[80vh\\]');
    expect(scrollableDiv).toBeInTheDocument();
  });
});


