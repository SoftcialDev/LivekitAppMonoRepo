/**
 * @fileoverview Header - Application header component
 * @summary Top header bar with title, icon, and sign out button
 * @description Reads current header info from Zustand store and renders on the left;
 * renders SignOutButton on the right.
 */

import React from 'react';
import { useHeaderStore } from '@/app/stores';
import IconWithLabel from './IconWithLabel';
import { SignOutButton } from '@/ui-kit/buttons';

/**
 * Header component
 * 
 * Reads current header info (title + optional iconSrc or iconNode) from Zustand store
 * and renders on the left; renders SignOutButton on the right.
 * 
 * Styles: background uses var(--color-primary-dark), with padding and optional bottom border.
 * 
 * @returns JSX element for the top header bar
 */
export const Header: React.FC = () => {
  const header = useHeaderStore((state) => state.header);
  const { title, iconSrc, iconAlt, iconNode } = header;

  return (
    <header className="flex items-center justify-between bg-[var(--color-primary-dark)] px-6 py-4">
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
  );
};

