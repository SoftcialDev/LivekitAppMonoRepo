import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StopReasonButton from '@/ui-kit/buttons/StopReasonButton';
import { StreamingStopReason } from '@/modules/pso-streaming/enums/streamingStopReason';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('@/modules/pso-streaming/enums/streamingStopReason', () => ({
  StreamingStopReason: {
    QuickBreak: 'QuickBreak',
    ShortBreak: 'ShortBreak',
    LunchBreak: 'LunchBreak',
    Emergency: 'Emergency',
    EndOfShift: 'EndOfShift',
  },
}));

jest.mock('@/ui-kit/buttons/constants/stopReasonButtonConstants', () => ({
  STOP_REASON_OPTIONS: [
    { value: 'QuickBreak', label: 'Quick Break', description: 'Short break' },
    { value: 'ShortBreak', label: 'Short Break', description: 'Medium break' },
  ],
  DROPDOWN_MIN_WIDTH: '200px',
  DROPDOWN_OFFSET_TOP: 5,
}));

describe('StopReasonButton', () => {
  beforeEach(() => {
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 100,
      left: 50,
      width: 200,
      height: 30,
      top: 70,
      right: 250,
      x: 50,
      y: 70,
      toJSON: jest.fn(),
    }));
  });

  it('should render button with children', () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect}>
        Stop Stream
      </StopReasonButton>
    );
    
    expect(screen.getByText('Stop Stream')).toBeInTheDocument();
  });

  it('should open dropdown when button is clicked', () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect}>
        Stop Stream
      </StopReasonButton>
    );
    
    const button = screen.getByText('Stop Stream').closest('button');
    fireEvent.click(button!);
    
    expect(screen.getByText('Quick Break')).toBeInTheDocument();
    expect(screen.getByText('Short Break')).toBeInTheDocument();
  });

  it('should call onSelect when option is selected', () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect}>
        Stop Stream
      </StopReasonButton>
    );
    
    const button = screen.getByText('Stop Stream').closest('button');
    fireEvent.click(button!);
    
    const quickBreakOption = screen.getByText('Quick Break');
    fireEvent.click(quickBreakOption);
    
    expect(onSelect).toHaveBeenCalledWith('QuickBreak');
  });

  it('should close dropdown after selecting option', async () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect}>
        Stop Stream
      </StopReasonButton>
    );
    
    const button = screen.getByText('Stop Stream').closest('button');
    fireEvent.click(button!);
    
    const quickBreakOption = screen.getByText('Quick Break');
    fireEvent.click(quickBreakOption);
    
    await waitFor(() => {
      expect(screen.queryByText('Quick Break')).not.toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect} disabled>
        Stop Stream
      </StopReasonButton>
    );
    
    const button = screen.getByText('Stop Stream').closest('button');
    expect(button).toBeDisabled();
  });

  it('should not open dropdown when disabled', () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect} disabled>
        Stop Stream
      </StopReasonButton>
    );
    
    const button = screen.getByText('Stop Stream').closest('button');
    fireEvent.click(button!);
    
    expect(screen.queryByText('Quick Break')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    const onSelect = jest.fn();
    render(
      <StopReasonButton onSelect={onSelect}>
        Stop Stream
      </StopReasonButton>
    );
    
    const button = screen.getByText('Stop Stream').closest('button');
    fireEvent.click(button!);
    
    expect(screen.getByText('Quick Break')).toBeInTheDocument();
    
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);
    
    await waitFor(() => {
      expect(screen.queryByText('Quick Break')).not.toBeInTheDocument();
    });
    
    document.body.removeChild(outsideElement);
  });

  it('should apply custom className', () => {
    const onSelect = jest.fn();
    const { container } = render(
      <StopReasonButton onSelect={onSelect} className="custom-class">
        Stop Stream
      </StopReasonButton>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });
});



