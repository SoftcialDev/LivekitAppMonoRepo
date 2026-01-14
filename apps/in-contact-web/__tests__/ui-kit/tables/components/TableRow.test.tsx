import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableRow } from '@/ui-kit/tables/components/TableRow';

jest.mock('@/ui-kit/tables/components/TableCheckbox', () => ({
  TableCheckbox: ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      data-testid="row-checkbox"
    />
  ),
}));

jest.mock('@/ui-kit/tables/components/TableCell', () => ({
  TableCell: ({ row, column }: { row: any; column: any }) => (
    <td>{row[column.key]}</td>
  ),
}));

describe('TableRow', () => {
  const row = { id: '1', name: 'John', email: 'john@example.com' };
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];

  it('should render table row with cells', () => {
    render(
      <TableRow
        row={row}
        rowIndex={0}
        columns={columns}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render selection checkbox when selection is provided', () => {
    const selection = {
      selectedKeys: [],
      onToggleRow: jest.fn(),
    };
    render(
      <TableRow
        row={row}
        rowIndex={0}
        columns={columns}
        selection={selection}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    expect(screen.getByTestId('row-checkbox')).toBeInTheDocument();
  });

  it('should not render selection checkbox when selection is undefined', () => {
    render(
      <TableRow
        row={row}
        rowIndex={0}
        columns={columns}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    expect(screen.queryByTestId('row-checkbox')).not.toBeInTheDocument();
  });

  it('should show checked state when row is selected', () => {
    const selection = {
      selectedKeys: ['1'],
      onToggleRow: jest.fn(),
    };
    render(
      <TableRow
        row={row}
        rowIndex={0}
        columns={columns}
        selection={selection}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    const checkbox = screen.getByTestId('row-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should call onToggleRow when checkbox is clicked', () => {
    const onToggleRow = jest.fn();
    const selection = {
      selectedKeys: [],
      onToggleRow,
    };
    render(
      <TableRow
        row={row}
        rowIndex={0}
        columns={columns}
        selection={selection}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    const checkbox = screen.getByTestId('row-checkbox');
    fireEvent.click(checkbox);
    
    expect(onToggleRow).toHaveBeenCalled();
  });

  it('should apply border-top for rows after first', () => {
    const { container } = render(
      <TableRow
        row={row}
        rowIndex={1}
        columns={columns}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    const tr = container.querySelector('tr');
    expect(tr).toHaveClass('border-t', 'border-white');
  });

  it('should not apply border-top for first row', () => {
    const { container } = render(
      <TableRow
        row={row}
        rowIndex={0}
        columns={columns}
        rowKey="1"
        isModalMode={false}
      />
    );
    
    const tr = container.querySelector('tr');
    expect(tr).not.toHaveClass('border-t');
  });
});

