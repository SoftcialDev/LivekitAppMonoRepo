import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DataTable } from '@/ui-kit/tables/DataTable';

jest.mock('@/ui-kit/tables/TableComponent', () => ({
  TableComponent: ({ data, loading, columns }: any) => (
    <div data-testid="table-component">
      {loading ? <div>Loading...</div> : (
        <div>
          {data.map((row: any) => (
            <div key={row.id}>{row.name}</div>
          ))}
        </div>
      )}
    </div>
  ),
}));

jest.mock('@/ui-kit/tables/TablePagination', () => ({
  TablePagination: ({ currentPage, totalPages, onPageChange, disabled }: any) => (
    <div>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={disabled || currentPage === 1}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={disabled || currentPage >= totalPages}>Next</button>
    </div>
  ),
}));

jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
}));

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
  ];

  const mockOnFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnFetch.mockResolvedValue({
      data: [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ],
      totalCount: 2,
    });
  });

  it('should render table component', () => {
    render(
      <DataTable
        columns={columns}
        dataLoader={{
          onFetch: mockOnFetch,
          totalCount: 2,
        }}
      />
    );
    
    expect(screen.getByTestId('table-component')).toBeInTheDocument();
  });

  it('should fetch initial data when component mounts', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
            initialFetchSize: 80,
          }}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalledWith(80, 0);
    });
  });

  it('should fetch more data when navigating to page that needs it', async () => {
    mockOnFetch.mockResolvedValueOnce({
      data: [{ id: '1', name: 'John' }],
      totalCount: 10,
    }).mockResolvedValueOnce({
      data: [{ id: '9', name: 'Bob' }],
      totalCount: 10,
    });
    
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 10,
            initialFetchSize: 8,
            fetchSize: 8,
          }}
          pageSize={8}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    await act(async () => {
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle search input changes', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
          search={{ enabled: true }}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'john' } });
    });
    
    expect(searchInput).toHaveValue('john');
  });

  it('should call external search handler when provided', async () => {
    const onSearch = jest.fn();
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
          search={{ enabled: true, onSearch }}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByPlaceholderText('Search...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });
    
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('should render toolbar actions', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
          leftToolbarActions={<button>Left Action</button>}
          rightToolbarActions={<button>Right Action</button>}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('Left Action')).toBeInTheDocument();
      expect(screen.getByText('Right Action')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    mockOnFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
        />
      );
    });
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle fetch errors gracefully', async () => {
    const { logError } = require('@/shared/utils/logger');
    mockOnFetch.mockRejectedValueOnce(new Error('Fetch failed'));
    
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
        />
      );
    });
    
    await waitFor(() => {
      expect(logError).toHaveBeenCalled();
    });
  });

  it('should apply custom filter when provided', async () => {
    const customFilter = jest.fn((data) => data.filter((item: any) => item.name === 'John'));
    
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
          customFilter={customFilter}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(customFilter).toHaveBeenCalled();
    });
  });

  it('should not show pagination when external search is used', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
          search={{ enabled: true, onSearch: jest.fn() }}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });

  it('should not fetch when totalCount is undefined', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: undefined,
          }}
        />
      );
    });
    
    // Wait a bit to ensure no fetch happens
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnFetch).not.toHaveBeenCalled();
  });

  it('should fetch when totalCount is 0', async () => {
    mockOnFetch.mockResolvedValueOnce({
      data: [],
      totalCount: 0,
    });
    
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 0,
          }}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
  });

  it('should use custom search placeholder', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
          search={{ enabled: true, placeholder: 'Search users...' }}
        />
      );
    });
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('should display data after fetch', async () => {
    await act(async () => {
      render(
        <DataTable
          columns={columns}
          dataLoader={{
            onFetch: mockOnFetch,
            totalCount: 2,
          }}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });
  });
});
