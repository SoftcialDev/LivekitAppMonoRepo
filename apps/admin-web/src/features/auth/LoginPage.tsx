// src/features/auth/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import logoSrc from '@assets/ColletteHealth_logo.png'
import camaraLogo from '@assets/InContact_logo.png'
import { SignInButton } from './components/SignInButton'

/**
 * LoginPage component.
 *
 * - Renders the Collette Health logo at the top.
 * - Below the logo, shows an "In Contact" label with the camera icon,
 *   styled in Montserrat Bold and in white.
 * - Displays the SignInButton.
 * - Handles MSAL initialization, redirect if already signed in, loading state,
 *   and error messages.
 *
 * Responsive behavior:
 * - Logo and camera icon scale up on sm/md breakpoints.
 * - Text size increases on larger viewports.
 *
 * @component
 * @returns {JSX.Element} The login page UI or a loading indicator.
 */
export const LoginPage: React.FC = () => {
  const { account, initialized, login } = useAuth()
  const navigate = useNavigate()

  // Loading state for login popup
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // Error message if login fails
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // If already signed in, redirect immediately
  useEffect(() => {
    if (initialized && account) {
      navigate('/dashboard', { replace: true })
    }
  }, [initialized, account, navigate])

  /**
   * handleLogin triggers MSAL login popup flow.
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null)
    setIsLoading(true)

    try {
      await login()
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      console.error('Login failed:', err)
      setErrorMessage('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Prevent flash of login UI while MSAL initializes
  if (!initialized) {
    return <div>Loading…</div>
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--color-primary-dark)] px-4 sm:px-6">
      {/* 1. Logo */}
      <img
        src={logoSrc}
        alt="Collette Health"
        className="h-16 sm:h-20 md:h-24 mb-12"
      />

      {/* 2. Camera icon + "In Contact" */}
      <div className="flex items-center mb-6 mt-8">
        <img
          src={camaraLogo}
          alt="Camera Icon"
         className="h-8 sm:h-10 md:h-12 mr-3"
        />
         <span className="montserrat-bold text-white text-xl sm:text-2xl md:text-3xl">
          In Contact
        </span>
      </div>

      {/* 3. Sign In button */}
      <SignInButton onClick={handleLogin} />

      {/* 4. Error message */}
      {errorMessage && (
        <p className="mt-4 montserrat-bold text-tertiary text-center px-4">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
