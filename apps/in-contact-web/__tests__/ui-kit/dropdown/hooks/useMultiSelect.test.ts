import { renderHook, act } from '@testing-library/react';
import { useMultiSelect } from '@/ui-kit/dropdown/hooks/useMultiSelect';

describe('useMultiSelect', () => {
  it('should toggle value - add when not selected', () => {
    const onSelectionChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: [],
        onSelectionChange,
        closeOnSelect: false,
      })
    );
    
    act(() => {
      result.current.toggle('value1');
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith(['value1']);
  });

  it('should toggle value - remove when selected', () => {
    const onSelectionChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: ['value1', 'value2'],
        onSelectionChange,
        closeOnSelect: false,
      })
    );
    
    act(() => {
      result.current.toggle('value1');
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith(['value2']);
  });

  it('should clear all selections', () => {
    const onSelectionChange = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: ['value1', 'value2'],
        onSelectionChange,
        closeOnSelect: false,
        onClose,
      })
    );
    
    act(() => {
      result.current.clearAll();
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith([]);
    expect(onClose).toHaveBeenCalled();
  });

  it('should select all provided values', () => {
    const onSelectionChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: ['value1'],
        onSelectionChange,
        closeOnSelect: false,
      })
    );
    
    act(() => {
      result.current.selectAll(['value2', 'value3']);
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith(['value1', 'value2', 'value3']);
  });

  it('should avoid duplicates when selecting all', () => {
    const onSelectionChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: ['value1'],
        onSelectionChange,
        closeOnSelect: false,
      })
    );
    
    act(() => {
      result.current.selectAll(['value1', 'value2']);
    });
    
    expect(onSelectionChange).toHaveBeenCalledWith(['value1', 'value2']);
  });

  it('should close when closeOnSelect is true and toggle is called', () => {
    const onSelectionChange = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: [],
        onSelectionChange,
        closeOnSelect: true,
        onClose,
      })
    );
    
    act(() => {
      result.current.toggle('value1');
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should check if value is selected', () => {
    const { result } = renderHook(() =>
      useMultiSelect({
        selectedValues: ['value1', 'value2'],
        onSelectionChange: jest.fn(),
        closeOnSelect: false,
      })
    );
    
    expect(result.current.isSelected('value1')).toBe(true);
    expect(result.current.isSelected('value3')).toBe(false);
  });
});



