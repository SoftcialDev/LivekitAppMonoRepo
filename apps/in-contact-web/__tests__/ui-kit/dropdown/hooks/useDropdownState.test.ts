import { renderHook, act } from '@testing-library/react';
import { useDropdownState } from '@/ui-kit/dropdown/hooks/useDropdownState';

describe('useDropdownState', () => {
  it('should initialize with false by default', () => {
    const { result } = renderHook(() => useDropdownState());
    
    expect(result.current.isOpen).toBe(false);
  });

  it('should initialize with provided initial value', () => {
    const { result } = renderHook(() => useDropdownState(true));
    
    expect(result.current.isOpen).toBe(true);
  });

  it('should open when open is called', () => {
    const { result } = renderHook(() => useDropdownState(false));
    
    act(() => {
      result.current.open();
    });
    
    expect(result.current.isOpen).toBe(true);
  });

  it('should close when close is called', () => {
    const { result } = renderHook(() => useDropdownState(true));
    
    act(() => {
      result.current.close();
    });
    
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle when toggle is called', () => {
    const { result } = renderHook(() => useDropdownState(false));
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isOpen).toBe(true);
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.isOpen).toBe(false);
  });
});



