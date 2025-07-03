import React from 'react'
import type { UserStatus } from '../../navigation/types/types'
import UserIndicator from '../../../components/UserIndicator'

/**
 * Props for UserItem.
 */
export interface UserItemProps {
  /** The user to display */
  user: UserStatus
  /** Callback when the Chat button is clicked */
  onChat: (email: string) => void
  /**
   * If true, disables navigation link around the user's name/avatar.
   * Admins and Supervisors should set this to true.
   */
  disableLink?: boolean
}

/**
 * UserItem
 *
 * Renders a row for a user, showing:
 * - A presence indicator via UserIndicator (optional link disabling)
 * - An offline SVG icon if the user is offline
 * - The user’s display name (bold white when online)
 * - A Chat button with the Microsoft Teams icon
 *
 * @param props.user         The user to display.
 * @param props.onChat       Called with the user’s email when Chat is clicked.
 * @param props.disableLink  When true, disables navigation link around name.
 */
const UserItem: React.FC<UserItemProps> = ({
  user,
  onChat,
  disableLink = false,
}) => {
  // Microsoft Teams brand chat icon
  const brandIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-tertiary)"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <path d="M3 7h10v10h-10z" />
      <path d="M6 10h4" />
      <path d="M8 10v4" />
      <path d="M8.104 17c.47 2.274 2.483 4 4.896 4a5 5 0 0 0 5 -5v-7h-5" />
      <path d="M18 18a4 4 0 0 0 4 -4v-5h-4" />
      <path d="M13.003 8.83a3 3 0 1 0 -1.833 -1.833" />
      <path d="M15.83 8.36a2.5 2.5 0 1 0 .594 -4.117" />
    </svg>
  )

  // Offline presence icon
  const offlineIcon = (
    <svg
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      fill="none"
    >
      <g id="SVGRepo_bgCarrier" strokeWidth="0" />
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
      <g id="SVGRepo_iconCarrier">
        <path
          fill="var(--color-tertiary)"
          fillRule="evenodd"
          d="M5.781 4.414a7 7 0 019.62 10.039l-9.62-10.04zm-1.408 1.42a7 7 0 009.549 9.964L4.373 5.836zM10 1a9 9 0 100 18 9 9 0 000-18z"
          clipRule="evenodd"
        />
      </g>
    </svg>
  )

  // Determine name styling: bold white if online, tertiary otherwise
  const nameStyles = user.status === 'online'
    ? 'font-light text-white truncate'
    : 'text-[var(--color-tertiary)] truncate'

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center space-x-2">
        {user.status === 'online' ? (
          <UserIndicator
            user={user}
            disableLink={disableLink}
            outerClass="w-8 h-8"
            innerClass="w-4 h-4"
            bgClass="bg-[var(--color-secondary)]"
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass={`${nameStyles} hover:text-[var(--color-secondary-hover)]`}
          />
        ) : (
          <>
            <span className="w-6 h-6 flex-shrink-0">{offlineIcon}</span>
            <span className={`${nameStyles} hover:text-[var(--color-secondary-hover)] cursor-pointer`}>
              {user.name}
            </span>
          </>
        )}
      </div>

      <button
        onClick={() => onChat(user.email)}
        className="
          flex items-center space-x-1
          px-2 py-1
          bg-transparent hover:bg-[rgba(255,255,255,0.1)]
          rounded cursor-pointer transition-colors
        "
      >
        <span className="flex-shrink-0">{brandIcon}</span>
        <span className="text-[var(--color-tertiary)]">Chat</span>
      </button>
    </div>
  )
}

export default UserItem
