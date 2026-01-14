import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle search input changes', async () => {
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
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    expect(searchInput).toHaveValue('john');
  });

  it('should call external search handler when provided', async () => {
    const onSearch = jest.fn();
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
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(onSearch).toHaveBeenCalledWith('test');
  });

  it('should render toolbar actions', async () => {
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
    
    await waitFor(() => {
      expect(screen.getByText('Left Action')).toBeInTheDocument();
      expect(screen.getByText('Right Action')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    mockOnFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(
      <DataTable
        columns={columns}
        dataLoader={{
          onFetch: mockOnFetch,
          totalCount: 2,
        }}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle fetch errors gracefully', async () => {
    const { logError } = require('@/shared/utils/logger');
    mockOnFetch.mockRejectedValueOnce(new Error('Fetch failed'));
    
    render(
      <DataTable
        columns={columns}
        dataLoader={{
          onFetch: mockOnFetch,
          totalCount: 2,
        }}
      />
    );
    
    await waitFor(() => {
      expect(logError).toHaveBeenCalled();
    });
  });

  it('should apply custom filter when provided', async () => {
    const customFilter = jest.fn((data) => data.filter((item: any) => item.name === 'John'));
    
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
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(customFilter).toHaveBeenCalled();
    });
  });

  it('should not show pagination when external search is used', async () => {
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
    
    await waitFor(() => {
      expect(mockOnFetch).toHaveBeenCalled();
    });
    
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });
});

