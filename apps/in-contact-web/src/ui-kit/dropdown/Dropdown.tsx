/**
 * @fileoverview Dropdown component
 * @summary Reusable dropdown component for selecting values
 * @description A customizable dropdown component that allows selecting a value from a list
 */

import React, { useState, useRef } from 'react';
import type { IDropdownProps } from './types/dropdownTypes';
import { useClickOutside } from './hooks/useClickOutside';

/**
 * Dropdown component
 * 
 * A reusable, customizable dropdown component that allows selecting a value from a list.
 * Supports custom styling, left adornments (like status dots), and flexible menu positioning.
 * 
 * @param props - Component props
 * @returns JSX element with dropdown
 * 
 * ```
 */
export const Dropdown: React.FC<IDropdownProps> = ({
  options,
  value,
  onSelect,
  label = 'Select',
  className = 'relative inline-block',
  buttonClassName = `
    flex items-center justify-between
    w-64
    px-4 py-2
    bg-[var(--color-tertiary)]
    text-[var(--color-primary)]
    rounded-lg
    focus:ring-0
    focus:border-transparent
  `,
  menuClassName = `
    absolute left-0 mt-1 w-48
    bg-[var(--color-tertiary)]
    border border-gray-200
    rounded-lg shadow-lg
    z-50 w-64
  `,
  menuClassNameOverride,
  menuBgClassName = 'bg-[var(--color-tertiary)] text-[var(--color-primary-dark)]',
  leftAdornment,
  menuStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value)?.label ?? label;

  // Handle clicks outside the dropdown
  useClickOutside(ref, () => {
    setIsOpen(false);
  });

  // Build menu container classes
  const defaultMenuContainer = `
    absolute left-0 mt-1
    border border-gray-200
    rounded-lg shadow-lg
    z-50 w-11/12
  `
    .replaceAll(/\s+/g, ' ')
    .trim();

  const menuContainerClass = (
    menuClassNameOverride?.trim() ||
    `${defaultMenuContainer} ${menuBgClassName} ${menuClassName}`.trim()
  )
    .replaceAll(/\s+/g, ' ')
    .trim();

  return (
    <div className={`w-full ${className}`} ref={ref}>
      <button
        type="button"
        className={`
          text-(--color-primary-dark)
          focus:ring-0 focus:outline-none
          font-medium rounded-full text-l px-5 py-2.5 text-center
          inline-flex items-center gap-2
          w-11/12
          ${buttonClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev);
        }}
      >
        <span className="flex items-center gap-2">
          {leftAdornment ? (
            <span aria-hidden className="inline-flex">
              {leftAdornment}
            </span>
          ) : null}
          <span>{selected}</span>
        </span>
        <svg
          className="w-2.5 h-2.5 ml-auto"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={
            menuClassNameOverride
              ? menuContainerClass
              : `
            absolute z-10 mt-2 divide-y divide-gray-100 rounded-lg shadow-sm
            w-11/12
            ${menuContainerClass}
          `
          }
          style={menuStyle}
        >
          <ul className={`rounded-lg border-0 ${menuBgClassName}`}>
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2
                    rounded-lg transition-colors
                    ${menuBgClassName}
                    hover:bg-(--color-primary)
                  `}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

