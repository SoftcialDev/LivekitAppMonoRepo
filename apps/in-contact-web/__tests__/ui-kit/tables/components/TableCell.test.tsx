import React from 'react';
import { render } from '@testing-library/react';
import { TableCell } from '@/ui-kit/tables/components/TableCell';

jest.mock('@/ui-kit/tables/utils/cellUtils', () => ({
  renderCellContent: jest.fn((row, column) => {
    if (column.render) {
      return column.render(row);
    }
    return row[column.key as string];
  }),
}));

describe('TableCell', () => {
  const row = { id: '1', name: 'John', age: 30 };
  const column = { key: 'name', header: 'Name' };

  it('should render cell content', () => {
    const { getByText } = render(
      <TableCell
        row={row}
        column={column}
        rowIndex={0}
        columnIndex={0}
        isModalMode={false}
      />
    );
    
    expect(getByText('John')).toBeInTheDocument();
  });

  it('should apply default padding when not in modal mode', () => {
    const { container } = render(
      <TableCell
        row={row}
        column={column}
        rowIndex={0}
        columnIndex={0}
        isModalMode={false}
      />
    );
    
    const td = container.querySelector('td');
    expect(td).toHaveClass('px-6');
  });

  it('should apply modal padding when in modal mode', () => {
    const { container } = render(
      <TableCell
        row={row}
        column={column}
        rowIndex={0}
        columnIndex={0}
        isModalMode={true}
      />
    );
    
    const td = container.querySelector('td');
    expect(td).toHaveClass('px-0');
  });

  it('should apply column cellClassName when provided', () => {
    const columnWithClass = { ...column, cellClassName: 'custom-class' };
    const { container } = render(
      <TableCell
        row={row}
        column={columnWithClass}
        rowIndex={0}
        columnIndex={0}
        isModalMode={false}
      />
    );
    
    const td = container.querySelector('td');
    expect(td).toHaveClass('custom-class');
  });

  it('should apply default whitespace-nowrap when cellClassName is not provided', () => {
    const { container } = render(
      <TableCell
        row={row}
        column={column}
        rowIndex={0}
        columnIndex={0}
        isModalMode={false}
      />
    );
    
    const td = container.querySelector('td');
    expect(td).toHaveClass('whitespace-nowrap');
  });

  it('should render custom render function result', () => {
    const columnWithRender = {
      ...column,
      render: (row: typeof row) => <span data-testid="custom-render">{row.name.toUpperCase()}</span>,
    };
    const { getByTestId } = render(
      <TableCell
        row={row}
        column={columnWithRender}
        rowIndex={0}
        columnIndex={0}
        isModalMode={false}
      />
    );
    
    expect(getByTestId('custom-render')).toBeInTheDocument();
    expect(getByTestId('custom-render')).toHaveTextContent('JOHN');
  });
});

