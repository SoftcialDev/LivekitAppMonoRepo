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

  const renderHeaderContent = () => {
    if (!title) {
      return <></>;
    }

    if (iconNode) {
      return <>{iconNode}</>;
    }

    if (iconSrc) {
      return (
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
      );
    }

    return <span className="text-white text-lg font-semibold">{title}</span>;
  };

  return (
    <header className="flex items-center justify-between bg-[var(--color-primary-dark)] px-6 py-4">
      <div className="flex items-center">
        {renderHeaderContent()}
      </div>

      <SignOutButton />
    </header>
  );
};

