import React from 'react'
import type { UserStatus } from '../../navigation/types/types'
import UserIndicator from '../../../components/UserIndicator'

interface OnlineUserItemProps {
  /** The user to display in online list */
  user: UserStatus
  /**
   * Callback invoked when clicking "Stop" for this user.
   * Receives the user's email.
   */
  onStop: (email: string) => void
}

/**
 * OnlineUserItem
 *
 * Renders a row for an online user:
 * - Uses UserIndicator to show a larger circular indicator + user name.
 * - A "Stop" button on the right: SVG square icon + text "Stop", colored via var(--color-tertiary).
 *   Button has transparent background and hover background for feedback.
 *
 * @param props.user The user object ({ email, name }).
 * @param props.onStop Callback function to call with user.email when Stop is clicked.
 * @returns JSX element representing an online user row.
 */
const OnlineUserItem: React.FC<OnlineUserItemProps> = ({ user, onStop }) => {
  // SVG square icon for Stop button
  const stopIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0" />
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <g id="SVGRepo_iconCarrier">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4 18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12z"
          fill="var(--color-tertiary)"
        />
      </g>
    </svg>
  )

  return (
    <div className="flex items-center justify-between mb-1">
      {/* Indicator + Name via UserIndicator */}
      <UserIndicator
        user={user}
        outerClass="w-8 h-8" // outer container for indicator
        innerClass="w-4 h-4" // inner circle
        bgClass="bg-[var(--color-secondary)]"
        borderClass="border-2 border-[var(--color-primary-dark)]"
        nameClass="truncate text-[var(--color-tertiary)] hover:text-[var(--color-secondary-hover)] cursor-pointer"
      />

      {/* Stop button */}
      <button
        onClick={() => onStop(user.email)}
        className="
          flex items-center space-x-1 px-2 py-1 text-sm
          bg-transparent
          hover:bg-[rgba(255,255,255,0.1)]
          rounded cursor-pointer transition-colors
        "
      >
        <span className="w-6 h-6 flex-shrink-0">{stopIcon}</span>
        <span className="text-[var(--color-tertiary)]">Stop</span>
      </button>
    </div>
  )
}

export default OnlineUserItem
