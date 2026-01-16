import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignOutButton } from '@/ui-kit/buttons/SignOutButton';
import { useAuth } from '@/modules/auth';
import { useNavigate } from 'react-router-dom';

jest.mock('@/modules/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('@/shared/utils/logger', () => ({
  logError: jest.fn(),
}));

jest.mock('@/ui-kit/icons', () => ({
  SignOutIcon: ({ className }: { className?: string }) => (
    <svg data-testid="sign-out-icon" className={className}>🚪</svg>
  ),
}));

describe('SignOutButton', () => {
  const mockLogout = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      logout: mockLogout,
    });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    localStorage.clear();
  });

  it('should render the sign out button', () => {
    render(<SignOutButton />);
    
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call logout, clear localStorage, and navigate on click', () => {
    render(<SignOutButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('should handle errors gracefully', () => {
    const { logError } = require('@/shared/utils/logger');
    mockLogout.mockImplementation(() => {
      throw new Error('Logout failed');
    });
    
    render(<SignOutButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(logError).toHaveBeenCalledWith('Logout failed', expect.objectContaining({ error: expect.any(Error) }));
  });

  it('should render SignOutIcon', () => {
    render(<SignOutButton />);
    
    expect(screen.getByTestId('sign-out-icon')).toBeInTheDocument();
  });
});



