import React from 'react';
import { render, screen } from '@testing-library/react';
import { TableBody } from '@/ui-kit/tables/components/TableBody';

jest.mock('@/ui-kit/feedback/Loading', () => ({
  Loading: ({ action }: { action: string }) => <div>Loading: {action}</div>,
}));

jest.mock('@/ui-kit/tables/components/TableRow', () => ({
  TableRow: ({ row, rowKey }: { row: any; rowKey: string }) => (
    <tr data-testid={`row-${rowKey}`}>
      <td>{row.name}</td>
    </tr>
  ),
}));

describe('TableBody', () => {
  const columns = [
    { key: 'name', header: 'Name' },
  ];

  const data = [
    { id: '1', name: 'John' },
    { id: '2', name: 'Jane' },
  ];

  it('should render table rows', () => {
    render(
      <TableBody
        displayData={data}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={false}
        showSelection={false}
        isModalMode={false}
      />
    );
    
    expect(screen.getByTestId('row-1')).toBeInTheDocument();
    expect(screen.getByTestId('row-2')).toBeInTheDocument();
  });

  it('should show loading state when loading is true', () => {
    render(
      <TableBody
        displayData={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={true}
        loadingAction="loading data"
        showSelection={false}
        isModalMode={false}
      />
    );
    
    expect(screen.getByText('Loading: loading data')).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(
      <TableBody
        displayData={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={false}
        showSelection={false}
        isModalMode={false}
      />
    );
    
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('should not show empty state when loading', () => {
    render(
      <TableBody
        displayData={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={true}
        showSelection={false}
        isModalMode={false}
      />
    );
    
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('should calculate colspan correctly with selection', () => {
    const { container } = render(
      <TableBody
        displayData={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={false}
        showSelection={true}
        isModalMode={false}
      />
    );
    
    const td = container.querySelector('td');
    expect(td).toHaveAttribute('colSpan', '2');
  });

  it('should calculate colspan correctly without selection', () => {
    const { container } = render(
      <TableBody
        displayData={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        loading={false}
        showSelection={false}
        isModalMode={false}
      />
    );
    
    const td = container.querySelector('td');
    expect(td).toHaveAttribute('colSpan', '1');
  });
});



