import { renderHook } from '@testing-library/react';
import { useFilteredOptions } from '@/ui-kit/dropdown/hooks/useFilteredOptions';

describe('useFilteredOptions', () => {
  const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
  ];

  it('should return all options when search term is empty', () => {
    const { result } = renderHook(() =>
      useFilteredOptions({ options, searchTerm: '', isLoading: false })
    );
    
    expect(result.current).toHaveLength(3);
    expect(result.current).toEqual(options);
  });

  it('should filter options by search term (case-insensitive)', () => {
    const { result } = renderHook(() =>
      useFilteredOptions({ options, searchTerm: 'app', isLoading: false })
    );
    
    expect(result.current).toHaveLength(1);
    expect(result.current[0].label).toBe('Apple');
  });

  it('should return empty array when isLoading is true', () => {
    const { result } = renderHook(() =>
      useFilteredOptions({ options, searchTerm: '', isLoading: true })
    );
    
    expect(result.current).toHaveLength(0);
  });

  it('should filter multiple matching options', () => {
    const { result } = renderHook(() =>
      useFilteredOptions({ options, searchTerm: 'a', isLoading: false })
    );
    
    expect(result.current).toHaveLength(3);
  });

  it('should return empty array when no options match', () => {
    const { result } = renderHook(() =>
      useFilteredOptions({ options, searchTerm: 'xyz', isLoading: false })
    );
    
    expect(result.current).toHaveLength(0);
  });
});

