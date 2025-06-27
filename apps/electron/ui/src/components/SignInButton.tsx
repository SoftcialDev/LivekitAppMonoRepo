import React from 'react';

///////////////////////////////////////////////////////////////////////////////
// Props
///////////////////////////////////////////////////////////////////////////////

/**
 * Props for the SignInButton component.
 *
 * @remarks
 * This component renders a rounded "pill" button styled for signing in.
 * - The `onClick` handler is called when the button is pressed.
 * - When `isLoading` is `true`, the button shows a loading state, is disabled,
 *   and its label changes to indicate progress
 *
 * @public
 */
export interface SignInButtonProps {
  /**
   * Function to call when the button is clicked.
   */
  onClick: () => void;

  /**
   * Whether the button is in a loading state.
   * @defaultValue `false`
   */
  isLoading?: boolean;
}

///////////////////////////////////////////////////////////////////////////////
// Component
///////////////////////////////////////////////////////////////////////////////

/**
 * A pill-shaped "Sign In" button with:
 * - Green background (`--color-secondary`) that darkens on hover
 * - Violet text and icon (`--color-primary-dark`)
 * - Fully rounded corners, smooth transitions, and accessible loading state
 *
 * @param props.onClick – Callback fired on click.
 * @param props.isLoading – Disables the button and shows a loading label when `true`.
 *
 * @returns A styled `<button>` element ready for sign-in actions.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [loading, setLoading] = useState(false);
 *
 *   const handleSignIn = async () => {
 *     setLoading(true);
 *     await auth.signIn();
 *     setLoading(false);
 *   };
 *
 *   return (
 *     <SignInButton
 *       onClick={handleSignIn}
 *       isLoading={loading}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const SignInButton: React.FC<SignInButtonProps> = ({
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
    <svg
      className="h-5 w-5 mr-2"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(0 24) scale(0.1 -0.1)"
        fill="currentColor"
        stroke="none"
      >
        <path d="M52 208 c-16 -16 -16 -160 0 -176 16 -16 120 -16 136 0 15 15 16 58 2 58 -5 0 -10 -11 -10 -25 0 -24 -3 -25 -60 -25 l-60 0 0 80 0 80 60 0 c57 0 60 -1 60 -25 0 -14 5 -25 10 -25 14 0 13 43 -2 58 -16 16 -120 16 -136 0z"/>
        <path d="M100 145 l-24 -26 27 -26 c27 -28 50 -26 27 2 -11 13 -7 15 29 15 22 0 41 5 41 10 0 6 -19 10 -42 10 -33 0 -39 3 -30 12 7 7 12 16 12 20 0 15 -17 8 -40 -17z"/>
      </g>
    </svg>

    <span className="uppercase font-semibold">
      {isLoading ? 'Signing In…' : 'Sign In'}
    </span>
  </button>
);
