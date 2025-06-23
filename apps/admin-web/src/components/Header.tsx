import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth'
import IconWithLabel from './IconWithLabel'
import { HeaderContext } from '../context/HeaderContext'

/**
 * SignOutButton component.
 *
 * Calls logout from useAuth and redirects to '/login' on success.
 *
 * @returns JSX button element for signing out.
 */
const SignOutButton: React.FC = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  /**
   * Handle click on "Sign Out": performs logout, then navigates to login page.
   */
  const handleSignOut = async () => {
    try {
      await logout()
      // After logout, redirect to login page
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout failed', err)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="
        flex items-center space-x-2
        px-8 py-2 border-2 border-[var(--color-secondary)]
        text-[var(--color-secondary)] font-semibold
        rounded-full
        hover:bg-[var(--color-primary-light)] hover:text-white
        transition-colors
      "
    >
      {/* SVG icon before text */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7 flex-shrink-0"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0" />
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
        <g id="SVGRepo_iconCarrier">
          {/* Use var(--color-secondary) for stroke */}
          <polyline
            points="18 9 21 12 18 15"
            style={{
              fill: 'none',
              stroke: 'var(--color-secondary)',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
            }}
          />
          <line
            x1="21"
            y1="12"
            x2="7"
            y2="12"
            style={{
              fill: 'none',
              stroke: 'var(--color-secondary)',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
            }}
          />
          <path
            d="M14,16v3a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V5A1,1,0,0,1,4,4h9a1,1,0,0,1,1,1V8"
            style={{
              fill: 'none',
              stroke: 'var(--color-secondary)',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
            }}
          />
        </g>
      </svg>

      <span>Sign Out</span>
    </button>
  )
}

/**
 * Header component.
 *
 * Reads current header info (title + optional iconSrc or iconNode) from HeaderContext and renders on the left;
 * renders SignOutButton on the right.
 *
 * Styles: background uses var(--color-primary-dark), with padding and optional bottom border.
 *
 * @returns JSX element for the top header bar.
 * @throws Error if used outside HeaderProvider.
 */
const Header: React.FC = () => {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('Header must be used inside HeaderProvider')
  }
  const { header } = context
  const { title, iconSrc, iconAlt, iconNode } = header

  return (
    <header className="flex items-center justify-between bg-[var(--color-primary-dark)] px-6 py-4 ">
      <div className="flex items-center">
        {title ? (
          iconNode ? (
            // Render custom ReactNode icon (e.g. <UserIndicator ... />)
            <>{iconNode}</>
          ) : iconSrc ? (
            // Render icon + label via IconWithLabel
            <IconWithLabel
              src={iconSrc}
              alt={iconAlt || title}
              imgSize="h-6 w-6"
              textSize="text-lg font-semibold"
              className="flex items-center"
              fillContainer={false}
            >
              {title}
            </IconWithLabel>
          ) : (
            // Only title text
            <span className="text-white text-lg font-semibold">{title}</span>
          )
        ) : (
          // No title: render nothing (or you could render a default logo here)
          <></>
        )}
      </div>

      <SignOutButton />
    </header>
  )
}

export default Header
