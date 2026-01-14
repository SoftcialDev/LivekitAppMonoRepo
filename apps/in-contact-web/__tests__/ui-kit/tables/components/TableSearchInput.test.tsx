import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableSearchInput } from '@/ui-kit/tables/components/TableSearchInput';

describe('TableSearchInput', () => {
  it('should render search input', () => {
    const onSearchChange = jest.fn();
    render(
      <TableSearchInput
        searchTerm=""
        onSearchChange={onSearchChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('should display search term', () => {
    const onSearchChange = jest.fn();
    render(
      <TableSearchInput
        searchTerm="test search"
        onSearchChange={onSearchChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('test search');
  });

  it('should call onSearchChange when input value changes', () => {
    const onSearchChange = jest.fn();
    render(
      <TableSearchInput
        searchTerm=""
        onSearchChange={onSearchChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'new search' } });
    
    expect(onSearchChange).toHaveBeenCalledWith('new search');
  });

  it('should use custom placeholder', () => {
    const onSearchChange = jest.fn();
    render(
      <TableSearchInput
        searchTerm=""
        onSearchChange={onSearchChange}
        placeholder="Search users..."
      />
    );
    
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('should apply modal mode padding when isModalMode is true', () => {
    const onSearchChange = jest.fn();
    const { container } = render(
      <TableSearchInput
        searchTerm=""
        onSearchChange={onSearchChange}
        isModalMode={true}
      />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('px-6', 'pt-4');
  });

  it('should apply default padding when isModalMode is false', () => {
    const onSearchChange = jest.fn();
    const { container } = render(
      <TableSearchInput
        searchTerm=""
        onSearchChange={onSearchChange}
        isModalMode={false}
      />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('px-6');
    expect(wrapper).not.toHaveClass('pt-4');
  });
});

