import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableHeader } from '@/ui-kit/tables/components/TableHeader';

jest.mock('@/ui-kit/tables/components/TableCheckbox', () => ({
  TableCheckbox: ({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      data-indeterminate={indeterminate}
      onChange={(e) => onChange(e.target.checked)}
      data-testid="table-checkbox"
    />
  ),
}));

describe('TableHeader', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];

  it('should render column headers', () => {
    render(<TableHeader columns={columns} headerBg="bg-blue-500" />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render selection checkbox when selection is provided', () => {
    const selection = {
      selectedKeys: [],
      onToggleAll: jest.fn(),
    };
    render(
      <TableHeader
        columns={columns}
        selection={selection}
        allVisibleSelected={false}
        someVisibleSelected={false}
        onToggleAll={jest.fn()}
        headerBg="bg-blue-500"
      />
    );
    
    expect(screen.getByTestId('table-checkbox')).toBeInTheDocument();
  });

  it('should not render selection checkbox when selection is undefined', () => {
    render(<TableHeader columns={columns} headerBg="bg-blue-500" />);
    
    expect(screen.queryByTestId('table-checkbox')).not.toBeInTheDocument();
  });

  it('should call onToggleAll when checkbox is clicked', () => {
    const onToggleAll = jest.fn();
    const selection = {
      selectedKeys: [],
      onToggleAll: jest.fn(),
    };
    render(
      <TableHeader
        columns={columns}
        selection={selection}
        allVisibleSelected={false}
        someVisibleSelected={false}
        onToggleAll={onToggleAll}
        headerBg="bg-blue-500"
      />
    );
    
    const checkbox = screen.getByTestId('table-checkbox');
    fireEvent.click(checkbox);
    
    expect(onToggleAll).toHaveBeenCalled();
  });

  it('should show checked state when allVisibleSelected is true', () => {
    const selection = {
      selectedKeys: [],
      onToggleAll: jest.fn(),
    };
    render(
      <TableHeader
        columns={columns}
        selection={selection}
        allVisibleSelected={true}
        someVisibleSelected={false}
        onToggleAll={jest.fn()}
        headerBg="bg-blue-500"
      />
    );
    
    const checkbox = screen.getByTestId('table-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should show indeterminate state when someVisibleSelected is true', () => {
    const selection = {
      selectedKeys: [],
      onToggleAll: jest.fn(),
    };
    render(
      <TableHeader
        columns={columns}
        selection={selection}
        allVisibleSelected={false}
        someVisibleSelected={true}
        onToggleAll={jest.fn()}
        headerBg="bg-blue-500"
      />
    );
    
    const checkbox = screen.getByTestId('table-checkbox');
    expect(checkbox).toHaveAttribute('data-indeterminate', 'true');
  });

  it('should apply headerBg class', () => {
    const { container } = render(<TableHeader columns={columns} headerBg="bg-blue-500" />);
    
    const th = container.querySelector('th');
    expect(th).toHaveClass('bg-blue-500');
  });

  it('should apply rounded corners to last column', () => {
    const { container } = render(<TableHeader columns={columns} headerBg="bg-blue-500" />);
    
    const ths = container.querySelectorAll('th');
    const lastTh = ths[ths.length - 1];
    expect(lastTh).toHaveClass('rounded-tr-lg', 'rounded-br-lg');
  });
});

