import { renderHook, act } from '@testing-library/react';
import { useTableData } from '@/ui-kit/tables/hooks/useTableData';

jest.mock('@/ui-kit/tables/utils/cellUtils', () => ({
  cellValueToString: jest.fn((value) => String(value)),
}));

describe('useTableData', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];

  const data = [
    { id: '1', name: 'John', email: 'john@example.com' },
    { id: '2', name: 'Jane', email: 'jane@example.com' },
    { id: '3', name: 'Bob', email: 'bob@example.com' },
  ];

  it('should return all data when local search is disabled', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
      })
    );

    expect(result.current.displayData).toHaveLength(3);
    expect(result.current.filteredData).toHaveLength(3);
  });

  it('should filter data when local search is enabled', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: true,
        enableLocalPagination: false,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.setSearchTerm('john');
    });

    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('John');
  });

  it('should paginate data when local pagination is enabled', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: false,
        enableLocalPagination: true,
        pageSize: 2,
      })
    );

    expect(result.current.displayData).toHaveLength(2);
    expect(result.current.totalPages).toBe(2);
  });

  it('should change page when handlePageChange is called', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: false,
        enableLocalPagination: true,
        pageSize: 2,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.displayData).toHaveLength(1);
  });

  it('should reset to page 1 when search term changes', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: true,
        enableLocalPagination: true,
        pageSize: 2,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.setSearchTerm('john');
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should calculate allVisibleSelected correctly', () => {
    const selection = {
      selectedKeys: ['1', '2'],
      onToggleAll: jest.fn(),
    };
    const { result } = renderHook(() =>
      useTableData({
        data: data.slice(0, 2),
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
        selection,
      })
    );

    expect(result.current.allVisibleSelected).toBe(true);
  });

  it('should calculate someVisibleSelected correctly', () => {
    const selection = {
      selectedKeys: ['1'],
      onToggleAll: jest.fn(),
    };
    const { result } = renderHook(() =>
      useTableData({
        data: data.slice(0, 2),
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
        selection,
      })
    );

    expect(result.current.someVisibleSelected).toBe(true);
    expect(result.current.allVisibleSelected).toBe(false);
  });

  it('should call onToggleAll when handleToggleAll is called', () => {
    const onToggleAll = jest.fn();
    const selection = {
      selectedKeys: [],
      onToggleAll,
    };
    const { result } = renderHook(() =>
      useTableData({
        data: data.slice(0, 2),
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
        selection,
      })
    );

    act(() => {
      result.current.handleToggleAll(true);
    });

    expect(onToggleAll).toHaveBeenCalledWith(true, ['1', '2']);
  });

  it('should return visibleRowKeys when selection is enabled', () => {
    const selection = {
      selectedKeys: [],
      onToggleAll: jest.fn(),
    };
    const { result } = renderHook(() =>
      useTableData({
        data: data.slice(0, 2),
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
        selection,
      })
    );

    expect(result.current.visibleRowKeys).toEqual(['1', '2']);
  });

  it('should return empty visibleRowKeys when selection is disabled', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
      })
    );

    expect(result.current.visibleRowKeys).toEqual([]);
  });

  it('should calculate totalPages correctly', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: false,
        enableLocalPagination: true,
        pageSize: 2,
      })
    );

    expect(result.current.totalPages).toBe(2);
  });

  it('should return 1 totalPages when pagination is disabled', () => {
    const { result } = renderHook(() =>
      useTableData({
        data,
        columns,
        enableLocalSearch: false,
        enableLocalPagination: false,
        pageSize: 10,
      })
    );

    expect(result.current.totalPages).toBe(1);
  });
});

