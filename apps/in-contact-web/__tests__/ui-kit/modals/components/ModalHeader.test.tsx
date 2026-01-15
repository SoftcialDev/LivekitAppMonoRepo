import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalHeader } from '@/ui-kit/modals/components/ModalHeader';

jest.mock('@/ui-kit/icons', () => ({
  CancelIcon: ({ className }: { className?: string }) => (
    <svg data-testid="cancel-icon" className={className}>×</svg>
  ),
}));

describe('ModalHeader', () => {
  it('should render with title', () => {
    const onClose = jest.fn();
    render(<ModalHeader title="Test Title" onClose={onClose} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render with icon when iconSrc is provided', () => {
    const onClose = jest.fn();
    render(
      <ModalHeader
        title="Test Title"
        iconSrc="/test-icon.png"
        iconAlt="Test Icon"
        onClose={onClose}
      />
    );
    
    const img = screen.getByAltText('Test Icon');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-icon.png');
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<ModalHeader title="Test Title" onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render actions when provided', () => {
    const onClose = jest.fn();
    render(
      <ModalHeader
        title="Test Title"
        onClose={onClose}
        actions={<button>Action</button>}
      />
    );
    
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should render as button when draggable is true', () => {
    const onClose = jest.fn();
    const onMouseDown = jest.fn();
    render(
      <ModalHeader
        title="Test Title"
        onClose={onClose}
        draggable={true}
        onMouseDown={onMouseDown}
      />
    );
    
    const button = screen.getByLabelText('Drag to move modal');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('cursor-move');
  });

  it('should render as div when draggable is false', () => {
    const onClose = jest.fn();
    const { container } = render(
      <ModalHeader
        title="Test Title"
        onClose={onClose}
        draggable={false}
      />
    );
    
    const div = container.querySelector('div.flex.items-center.justify-between');
    expect(div).toBeInTheDocument();
  });

  it('should call onMouseDown when draggable and button is clicked', () => {
    const onClose = jest.fn();
    const onMouseDown = jest.fn();
    render(
      <ModalHeader
        title="Test Title"
        onClose={onClose}
        draggable={true}
        onMouseDown={onMouseDown}
      />
    );
    
    const button = screen.getByLabelText('Drag to move modal');
    fireEvent.mouseDown(button);
    
    expect(onMouseDown).toHaveBeenCalledTimes(1);
  });

  it('should render React node as title', () => {
    const onClose = jest.fn();
    render(
      <ModalHeader
        title={<span data-testid="custom-title">Custom Title</span>}
        onClose={onClose}
      />
    );
    
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });
});


