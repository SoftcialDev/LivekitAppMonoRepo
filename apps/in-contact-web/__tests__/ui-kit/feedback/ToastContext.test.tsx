import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/ui-kit/feedback/ToastContext';
import { ContextError } from '@/shared/errors';

jest.mock('@/ui-kit/feedback/Toast', () => ({
  Toast: ({ message, type }: { message: string; type: string }) => (
    <div data-testid="toast" data-type={type}>{message}</div>
  ),
}));

jest.mock('@/shared/errors', () => ({
  ContextError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ContextError';
    }
  },
}));

const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast('Test message', 'success')}>
      Show Toast
    </button>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should provide toast context to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    expect(screen.getByText('Show Toast')).toBeInTheDocument();
  });

  it('should show toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Toast');
    act(() => {
      fireEvent.click(button);
    });
    
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should show toast with correct type', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Toast');
    act(() => {
      fireEvent.click(button);
    });
    
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveAttribute('data-type', 'success');
  });

  it('should show multiple toasts', () => {
    const MultipleToastsComponent = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button onClick={() => showToast('First', 'success')}>First</button>
          <button onClick={() => showToast('Second', 'error')}>Second</button>
        </div>
      );
    };
    
    render(
      <ToastProvider>
        <MultipleToastsComponent />
      </ToastProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('First'));
      fireEvent.click(screen.getByText('Second'));
    });
    
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('should remove toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Toast');
    act(() => {
      fireEvent.click(button);
    });
    
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });
  });

  it('should use custom duration', async () => {
    const CustomDurationComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Test', 'success', 5000)}>
          Show Toast
        </button>
      );
    };
    
    render(
      <ToastProvider>
        <CustomDurationComponent />
      </ToastProvider>
    );
    
    const button = screen.getByText('Show Toast');
    act(() => {
      fireEvent.click(button);
    });
    
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    await waitFor(() => {
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });
  });

  it('should throw error when useToast is used outside provider', () => {
    const ErrorComponent = () => {
      useToast();
      return <div>Error</div>;
    };
    
    expect(() => {
      render(<ErrorComponent />);
    }).toThrow(ContextError);
  });

  it('should show different toast types', () => {
    const AllTypesComponent = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button onClick={() => showToast('Success', 'success')}>Success</button>
          <button onClick={() => showToast('Error', 'error')}>Error</button>
          <button onClick={() => showToast('Warning', 'warning')}>Warning</button>
        </div>
      );
    };
    
    render(
      <ToastProvider>
        <AllTypesComponent />
      </ToastProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByText('Success'));
      fireEvent.click(screen.getByText('Error'));
      fireEvent.click(screen.getByText('Warning'));
    });
    
    const toasts = screen.getAllByTestId('toast');
    expect(toasts).toHaveLength(3);
    expect(toasts[0]).toHaveAttribute('data-type', 'success');
    expect(toasts[1]).toHaveAttribute('data-type', 'error');
    expect(toasts[2]).toHaveAttribute('data-type', 'warning');
  });
});

