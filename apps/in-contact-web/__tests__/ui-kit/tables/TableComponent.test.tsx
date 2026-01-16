import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableComponent } from '@/ui-kit/tables/TableComponent';

jest.mock('@/ui-kit/tables/components/TableSearchInput', () => ({
  TableSearchInput: ({ searchTerm, onSearchChange, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

jest.mock('@/ui-kit/tables/components/TableHeader', () => ({
  TableHeader: ({ columns }: any) => (
    <thead>
      <tr>
        {columns.map((col: any) => (
          <th key={col.key}>{col.header}</th>
        ))}
      </tr>
    </thead>
  ),
}));

jest.mock('@/ui-kit/tables/components/TableBody', () => ({
  TableBody: ({ displayData, loading }: any) => (
    <tbody>
      {loading ? (
        <tr><td>Loading...</td></tr>
      ) : (
        displayData.map((row: any, idx: number) => (
          <tr key={idx}>
            <td>{row.name}</td>
          </tr>
        ))
      )}
    </tbody>
  ),
}));

jest.mock('@/ui-kit/tables/TablePagination', () => ({
  TablePagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div>
      <button onClick={() => onPageChange(currentPage - 1)}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
    </div>
  ),
}));

jest.mock('@/ui-kit/tables/hooks/useTableData', () => ({
  useTableData: jest.fn(),
}));

describe('TableComponent', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];

  const data = [
    { id: '1', name: 'John', email: 'john@example.com' },
    { id: '2', name: 'Jane', email: 'jane@example.com' },
  ];

  const mockUseTableData = require('@/ui-kit/tables/hooks/useTableData').useTableData;

  beforeEach(() => {
    mockUseTableData.mockReturnValue({
      searchTerm: '',
      setSearchTerm: jest.fn(),
      currentPage: 1,
      handlePageChange: jest.fn(),
      displayData: data,
      filteredData: data,
      totalPages: 1,
      allVisibleSelected: false,
      someVisibleSelected: false,
      handleToggleAll: jest.fn(),
    });
  });

  it('should render table with data', () => {
    render(
      <TableComponent
        columns={columns}
        data={data}
      />
    );
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('should render search input when enableLocalSearch is true', () => {
    render(
      <TableComponent
        columns={columns}
        data={data}
        enableLocalSearch={true}
      />
    );
    
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should not render search input when enableLocalSearch is false', () => {
    render(
      <TableComponent
        columns={columns}
        data={data}
        enableLocalSearch={false}
      />
    );
    
    expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
  });

  it('should render pagination when enableLocalPagination is true', () => {
    mockUseTableData.mockReturnValue({
      searchTerm: '',
      setSearchTerm: jest.fn(),
      currentPage: 1,
      handlePageChange: jest.fn(),
      displayData: data,
      filteredData: data,
      totalPages: 2,
      allVisibleSelected: false,
      someVisibleSelected: false,
      handleToggleAll: jest.fn(),
    });
    
    render(
      <TableComponent
        columns={columns}
        data={data}
        enableLocalPagination={true}
      />
    );
    
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('should not render pagination when enableLocalPagination is false', () => {
    render(
      <TableComponent
        columns={columns}
        data={data}
        enableLocalPagination={false}
      />
    );
    
    expect(screen.queryByText(/Page/)).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <TableComponent
        columns={columns}
        data={data}
        loading={true}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should apply custom tablePadding', () => {
    const { container } = render(
      <TableComponent
        columns={columns}
        data={data}
        tablePadding="px-4 py-4"
      />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('px-4', 'py-4');
  });

  it('should apply modal mode when tablePadding is px-0 py-0', () => {
    const { container } = render(
      <TableComponent
        columns={columns}
        data={data}
        tablePadding="px-0 py-0"
      />
    );
    
    const scrollableDiv = container.querySelector('.custom-scrollbar');
    expect(scrollableDiv).toBeInTheDocument();
  });

  it('should use custom searchPlaceholder', () => {
    render(
      <TableComponent
        columns={columns}
        data={data}
        enableLocalSearch={true}
        searchPlaceholder="Search users..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search users...');
    expect(input).toBeInTheDocument();
  });
});



