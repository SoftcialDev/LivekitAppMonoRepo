import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableCheckbox } from '@/ui-kit/tables/components/TableCheckbox';

describe('TableCheckbox', () => {
  it('should render unchecked checkbox by default', () => {
    const onChange = jest.fn();
    render(<TableCheckbox checked={false} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render checked checkbox when checked prop is true', () => {
    const onChange = jest.fn();
    render(<TableCheckbox checked={true} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onChange with true when unchecked checkbox is clicked', () => {
    const onChange = jest.fn();
    render(<TableCheckbox checked={false} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange with false when checked checkbox is clicked', () => {
    const onChange = jest.fn();
    render(<TableCheckbox checked={true} onChange={onChange} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = jest.fn();
    render(<TableCheckbox checked={false} onChange={onChange} disabled />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should set indeterminate state', () => {
    const onChange = jest.fn();
    const { container } = render(
      <TableCheckbox checked={false} onChange={onChange} indeterminate />
    );
    
    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });
});


