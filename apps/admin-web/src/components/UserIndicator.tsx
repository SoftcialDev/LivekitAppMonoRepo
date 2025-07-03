import React from 'react';
import { Link } from 'react-router-dom';
import type { UserStatus } from '../features/navigation/types/types';

/**
 * Props for UserIndicator.
 */
interface UserIndicatorProps {
  /**
   * The user object containing at least `name` (displayed) and `email`.
   */
  user: UserStatus;
  /**
   * If true, the user name will render without a clickable link.
   */
  disableLink?: boolean;
  /**
   * Tailwind classes for the outer container size
   * (e.g. `"w-8 h-8"`). Defaults to `"w-8 h-8"`.
   */
  outerClass?: string;
  /**
   * Tailwind classes for the inner circle size.
   * If omitted, `outerClass` is reused.
   */
  innerClass?: string;
  /**
   * Tailwind classes for the inner circle background.
   * Defaults to `"bg-[var(--color-secondary)]"`.
   */
  bgClass?: string;
  /**
   * Tailwind classes for the inner circle border.
   * Defaults to `"border-2 border-[var(--color-primary-dark)]"`.
   */
  borderClass?: string;
  /**
   * Tailwind classes for the username span.
   * Defaults to `"truncate text-[var(--color-tertiary)]
   * hover:text-[var(--color-secondary-hover)] cursor-pointer"`.
   */
  nameClass?: string;
}

/**
 * UserIndicator component.
 *
 * Displays a small colored status circle next to the user's name.
 * When `disableLink` is false, wraps the name in a React Router `<Link>`
 * navigating to `/videos/:email`. Otherwise renders a non-clickable `<div>`.
 *
 * @param props.user         The user to display.
 * @param props.disableLink  If true, disables navigation.
 * @param props.outerClass   Tailwind classes for the outer wrapper.
 * @param props.innerClass   Tailwind classes for the inner circle.
 * @param props.bgClass      Tailwind classes for the circle background.
 * @param props.borderClass  Tailwind classes for the circle border.
 * @param props.nameClass    Tailwind classes for the user's name.
 */
const UserIndicator: React.FC<UserIndicatorProps> = ({
  user,
  disableLink   = false,
  outerClass    = 'w-8 h-8',
  innerClass,
  bgClass       = 'bg-[var(--color-secondary)]',
  borderClass   = 'border-2 border-[var(--color-primary-dark)]',
  nameClass     = 'truncate text-[var(--color-tertiary)] hover:text-[var(--color-secondary-hover)] cursor-pointer',
}) => {
  const circleSize = innerClass ?? outerClass;
  const toPath     = `/videos/${encodeURIComponent(user.email)}`;

  // Choose container type based on disableLink
  const Container: React.ElementType = disableLink ? 'div' : Link;
  const containerProps = disableLink
    ? {}
    : { to: toPath };

  return (
    <Container
      {...containerProps}
      className="flex items-center space-x-2"
    >
      <span className={`flex items-center justify-center ${outerClass} flex-shrink-0`}>
        <span className={`${circleSize} rounded-full ${bgClass} ${borderClass}`} />
      </span>
      <span className={nameClass}>
        {user.name}
      </span>
    </Container>
  );
};

export default UserIndicator;
