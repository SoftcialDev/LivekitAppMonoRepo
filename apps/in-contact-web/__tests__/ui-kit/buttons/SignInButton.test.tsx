import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInButton } from '@/ui-kit/buttons/SignInButton';

jest.mock('@/ui-kit/icons', () => ({
  SignInIcon: ({ className }: { className?: string }) => (
    <svg data-testid="sign-in-icon" className={className}>🔐</svg>
  ),
}));

describe('SignInButton', () => {
  it('should render the sign in button', () => {
    const onClick = jest.fn();
    render(<SignInButton onClick={onClick} />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<SignInButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when isLoading is true', () => {
    const onClick = jest.fn();
    render(<SignInButton onClick={onClick} isLoading />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should show "Signing In…" text when loading', () => {
    const onClick = jest.fn();
    render(<SignInButton onClick={onClick} isLoading />);
    
    expect(screen.getByText('Signing In…')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });

  it('should not call onClick when loading', () => {
    const onClick = jest.fn();
    render(<SignInButton onClick={onClick} isLoading />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render SignInIcon', () => {
    const onClick = jest.fn();
    render(<SignInButton onClick={onClick} />);
    
    expect(screen.getByTestId('sign-in-icon')).toBeInTheDocument();
  });
});


