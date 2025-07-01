import React from 'react'
import type { UserStatus } from '../../navigation/types/types'
import UserIndicator from '../../../components/UserIndicator'

export interface UserItemProps {
  /** The user to display */
  user: UserStatus
  /** Is the user actually streaming right now? */
  isStreaming: boolean
  /**
   * Callback when the Play/Stop button is clicked.
   * Signature: (email: string, action: 'PLAY' | 'STOP') => void
   */
  onToggle: (email: string, action: 'PLAY' | 'STOP') => void
}

/**
 * UserItem
 *
 * Renders a row for a user, showing:
 * - A larger online indicator via UserIndicator, or an offline SVG icon
 * - The user’s display name (styled exactly as in Online/Offline components)
 * - A Play or Stop button (with the exact same SVG + styles)
 */
export const UserItem: React.FC<UserItemProps> = ({
  user,
  isStreaming,
  onToggle,
}) => {
  const isPlay = !isStreaming

  const playIcon = (
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
          d="M21.4086 9.35258C23.5305 10.5065 23.5305 13.4935 21.4086 14.6474L8.59662 21.6145C6.53435 22.736 4 21.2763 4 18.9671L4 5.0329C4 2.72368 6.53435 1.26402 8.59661 2.38548L21.4086 9.35258Z"
          fill="var(--color-tertiary)"
        />
      </g>
    </svg>
  )

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

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center space-x-2">
        {user.status === 'online' ? (
          <UserIndicator
            user={user}
            outerClass="w-8 h-8"
            innerClass="w-4 h-4"
            bgClass="bg-[var(--color-secondary)]"
            borderClass="border-2 border-[var(--color-primary-dark)]"
            nameClass="truncate text-[var(--color-tertiary)] hover:text-[var(--color-secondary-hover)] cursor-pointer"
          />
        ) : (
          <>
            <span className="w-6 h-6 flex-shrink-0">{offlineIcon}</span>
            <span className="truncate text-[var(--color-tertiary)] hover:text-[var(--color-secondary-hover)] cursor-pointer">
              {user.name}
            </span>
          </>
        )}
      </div>

      <button
        onClick={() => onToggle(user.email, isPlay ? 'PLAY' : 'STOP')}
        className="
          flex items-center space-x-1
          px-2 py-1
          bg-transparent hover:bg-[rgba(255,255,255,0.1)]
          rounded cursor-pointer transition-colors
        "
      >
        <span className="w-6 h-6 flex-shrink-0">
          {isPlay ? playIcon : stopIcon}
        </span>
        <span className="text-[var(--color-tertiary)]">
          {isPlay ? 'Play' : 'Stop'}
        </span>
      </button>
    </div>
  )
}

export default UserItem
