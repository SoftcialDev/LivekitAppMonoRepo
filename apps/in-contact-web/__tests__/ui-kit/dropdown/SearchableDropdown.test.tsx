import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchableDropdown } from '@/ui-kit/dropdown/SearchableDropdown';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('SearchableDropdown', () => {
  const options = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
  ];

  it('should render the search input', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('should open menu when input is clicked', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('should filter options when typing', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'app' } });
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('should toggle selection when option is clicked', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    
    const appleOption = screen.getByText('Apple').closest('button');
    fireEvent.click(appleOption!);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['apple']);
  });

  it('should show clear button when there are selected values', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={['apple']}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const clearButton = screen.getByTitle('Clear all selections');
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear all selections when clear button is clicked', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={['apple', 'banana']}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const clearButton = screen.getByTitle('Clear all selections');
    fireEvent.click(clearButton);
    
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('should show loading state when isLoading is true', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        isLoading
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show "Select All" button when showSelectAll is true', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        showSelectAll
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('should select all filtered options when "Select All" is clicked', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
        showSelectAll
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'app' } });
    
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['apple']);
  });

  it('should show "No results found" when filter returns no results', () => {
    const onSelectionChange = jest.fn();
    render(
      <SearchableDropdown
        options={options}
        selectedValues={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'xyz' } });
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});


