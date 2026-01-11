/**
 * @fileoverview SignInButton - Button component for signing in
 * @summary Pill-shaped button for authentication
 * @description A styled button component for signing in users.
 * Features loading state, accessibility attributes, and smooth transitions.
 */

import React from 'react';
import type { ISignInButtonProps } from './types';
import { SignInIcon } from '@/ui-kit/icons';

/**
 * SignInButton component
 * 
 * A pill-shaped "Sign In" button with:
 * - Green background (--color-secondary) that darkens on hover
 * - Violet text and icon (--color-primary-dark)
 * - Fully rounded corners, smooth transitions, and accessible loading state
 * 
 * @param props.onClick - Callback fired on click
 * @param props.isLoading - Disables the button and shows a loading label when true
 * @returns A styled button element ready for sign-in actions
 * 
 * @example
 * ```tsx
 * const [loading, setLoading] = useState(false);
 * 
 * const handleSignIn = async () => {
 *   setLoading(true);
 *   await auth.signIn();
 *   setLoading(false);
 * };
 * 
 * return (
 *   <SignInButton onClick={handleSignIn} isLoading={loading} />
 * );
 * ```
 */
export const SignInButton: React.FC<ISignInButtonProps> = ({
  onClick,
  isLoading = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-busy={isLoading}
    className="
      flex items-center justify-center
      rounded-full px-6 py-2
      bg-[var(--color-secondary)]
      hover:bg-[var(--color-secondary-hover)]
      text-[var(--color-primary-dark)]
      transition duration-150 ease-in-out
      focus:outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
    "
  >
    {/* Icon uses currentColor for easy theming */}
    <SignInIcon className="h-5 w-5 mr-2" />

    <span className="uppercase font-semibold">
      {isLoading ? 'Signing In…' : 'Sign In'}
    </span>
  </button>
);

