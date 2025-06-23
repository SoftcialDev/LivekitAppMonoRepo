import React from 'react'
import type { UserStatus } from '../../navigation/types/types'

interface OfflineUserItemProps {
  /** The user to display in offline list */
  user: UserStatus
  /**
   * Callback invoked when clicking "Play" for this user.
   * Receives the user's email.
   */
  onPlay: (email: string) => void
}

/**
 * OfflineUserItem
 *
 * Renders a row for an offline user:
 * - An "offline" status icon (SVG circle/slash) with fill using CSS variable (--color-tertiary).
 * - The user's name, with base color and hover changing to var(--color-secondary-hover), and pointer cursor.
 * - A "Play" button: SVG play icon + text "Play", both colored via var(--color-tertiary). 
 *   Button has transparent background and hover background for feedback.
 *
 * @param props.user The user object ({ email, name }).
 * @param props.onPlay Callback function to call with user.email when Play is clicked.
 * @returns JSX element representing an offline user row.
 */
const OfflineUserItem: React.FC<OfflineUserItemProps> = ({ user, onPlay }) => {
  return (
    <div className="flex items-center justify-between mb-1">
      {/* Icon offline + name */}
      <div className="flex items-center space-x-2">
        {/* SVG offline icon */}
        <span className="w-6 h-6 flex-shrink-0">
          <svg
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            fill="none"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                fill="var(--color-tertiary)"
                fillRule="evenodd"
                d="M5.781 4.414a7 7 0 019.62 10.039l-9.62-10.04zm-1.408 1.42a7 7 0 009.549 9.964L4.373 5.836zM10 1a9 9 0 100 18 9 9 0 000-18z"
                clipRule="evenodd"
              />
            </g>
          </svg>
        </span>
        {/* User name */}
        <span className="truncate text-[var(--color-tertiary)] hover:text-[var(--color-secondary-hover)] cursor-pointer">
          {user.name}
        </span>
      </div>

      {/* Play button: icon + text */}
      <button
        onClick={() => onPlay(user.email)}
        className="
          flex items-center space-x-1
          px-2 py-1 rounded
          bg-transparent
          hover:bg-[rgba(255,255,255,0.1)]
          cursor-pointer transition-colors
        "
      >
        {/* SVG Play icon */}
        <span className="w-6 h-6 flex-shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"
                fill="var(--color-tertiary)"
              ></path>
            </g>
          </svg>
        </span>
        <span className="text-[var(--color-tertiary)]">Play</span>
      </button>
    </div>
  )
}

export default OfflineUserItem
