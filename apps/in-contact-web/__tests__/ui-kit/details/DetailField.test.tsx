import React from 'react';
import { render, screen } from '@testing-library/react';
import { DetailField } from '@/ui-kit/details/DetailField';

describe('DetailField', () => {
  it('should render label and value', () => {
    render(<DetailField label="Name" value="John Doe" />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render React node as value', () => {
    render(
      <DetailField
        label="Status"
        value={<span data-testid="status">Active</span>}
      />
    );
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toBeInTheDocument();
  });

  it('should apply monospace font when monospace is true', () => {
    const { container } = render(
      <DetailField label="ID" value="12345" monospace />
    );
    
    const valueElement = container.querySelector('p');
    expect(valueElement).toHaveClass('font-mono', 'text-sm');
  });

  it('should not apply monospace font when monospace is false', () => {
    const { container } = render(
      <DetailField label="Name" value="John" monospace={false} />
    );
    
    const valueElement = container.querySelector('p');
    expect(valueElement).not.toHaveClass('font-mono');
  });

  it('should apply default label className', () => {
    const { container } = render(
      <DetailField label="Name" value="John" />
    );
    
    const label = container.querySelector('label');
    expect(label).toHaveClass('text-gray-400', 'text-sm');
  });

  it('should apply custom label className', () => {
    const { container } = render(
      <DetailField
        label="Name"
        value="John"
        labelClassName="custom-label"
      />
    );
    
    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-label');
  });

  it('should apply custom value className', () => {
    const { container } = render(
      <DetailField
        label="Name"
        value="John"
        valueClassName="custom-value"
      />
    );
    
    const valueElement = container.querySelector('p');
    expect(valueElement).toHaveClass('custom-value');
  });

  it('should apply custom className to container', () => {
    const { container } = render(
      <DetailField
        label="Name"
        value="John"
        className="custom-container"
      />
    );
    
    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('custom-container');
  });

  it('should render number value', () => {
    render(<DetailField label="Age" value={30} />);
    
    expect(screen.getByText('30')).toBeInTheDocument();
  });
});



