import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TablePagination } from '@/ui-kit/tables/TablePagination';

jest.mock('@/ui-kit/tables/components/PaginationButton', () => ({
  PaginationButton: ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{label}</button>
  ),
}));

describe('TablePagination', () => {
  it('should render pagination controls', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should call onPageChange when Next is clicked', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when Previous is clicked', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable Previous button on first page', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should disable Next button on last page', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={5}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('should disable all buttons when disabled prop is true', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={2}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
        disabled={true}
      />
    );
    
    const previousButton = screen.getByText('Previous');
    const nextButton = screen.getByText('Next');
    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('should not call onPageChange when Previous is clicked on first page', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should not call onPageChange when Next is clicked on last page', () => {
    const onPageChange = jest.fn();
    render(
      <TablePagination
        currentPage={5}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        onPageChange={onPageChange}
      />
    );
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(onPageChange).not.toHaveBeenCalled();
  });
});


