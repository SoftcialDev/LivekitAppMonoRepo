import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DownloadButton } from '@/ui-kit/buttons/DownloadButton';

describe('DownloadButton', () => {
  it('should render the download button', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Download');
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should use custom title when provided', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} title="Download file" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Download file');
  });

  it('should apply custom className', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} disabled />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should display download emoji', () => {
    const onClick = jest.fn();
    render(<DownloadButton onClick={onClick} />);
    
    expect(screen.getByText('📥')).toBeInTheDocument();
  });
});

