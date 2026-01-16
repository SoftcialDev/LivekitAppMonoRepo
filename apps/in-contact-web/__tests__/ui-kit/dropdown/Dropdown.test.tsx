import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dropdown } from '@/ui-kit/dropdown/Dropdown';

describe('Dropdown', () => {
  const options = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  it('should render the dropdown button with default label', () => {
    const onSelect = jest.fn();
    render(<Dropdown options={options} value={null} onSelect={onSelect} />);
    
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render the dropdown button with custom label', () => {
    const onSelect = jest.fn();
    render(<Dropdown options={options} value={null} onSelect={onSelect} label="Choose" />);
    
    expect(screen.getByText('Choose')).toBeInTheDocument();
  });

  it('should show selected option label when value is set', () => {
    const onSelect = jest.fn();
    render(<Dropdown options={options} value="opt2" onSelect={onSelect} />);
    
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should open menu when button is clicked', () => {
    const onSelect = jest.fn();
    render(<Dropdown options={options} value={null} onSelect={onSelect} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should call onSelect and close menu when option is selected', () => {
    const onSelect = jest.fn();
    render(<Dropdown options={options} value={null} onSelect={onSelect} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const option1 = screen.getByText('Option 1');
    fireEvent.click(option1);
    
    expect(onSelect).toHaveBeenCalledWith('opt1');
    waitFor(() => {
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });

  it('should render left adornment when provided', () => {
    const onSelect = jest.fn();
    const adornment = <span data-testid="adornment">●</span>;
    render(<Dropdown options={options} value={null} onSelect={onSelect} leftAdornment={adornment} />);
    
    expect(screen.getByTestId('adornment')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const onSelect = jest.fn();
    render(<Dropdown options={options} value={null} onSelect={onSelect} className="custom-class" />);
    
    const container = screen.getByRole('button').closest('div');
    expect(container).toHaveClass('custom-class');
  });
});



