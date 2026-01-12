/**
 * @fileoverview StopReasonButton - Dropdown button for selecting stop reasons
 * @summary Button with dropdown menu for selecting streaming stop reasons
 * @description A dropdown button component for selecting stop reasons when stopping
 * a stream. Displays a button with dropdown arrow that opens a menu with stop reason
 * options (Quick Break, Short Break, Lunch Break, Emergency, End of Shift).
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StreamingStopReason } from '@/modules/pso-streaming/enums/streamingStopReason';
import type { IStopReasonButtonProps } from './types/stopReasonButtonTypes';
import { STOP_REASON_OPTIONS, DROPDOWN_MIN_WIDTH, DROPDOWN_OFFSET_TOP } from './constants/stopReasonButtonConstants';

/**
 * StopReasonButton component
 * 
 * A dropdown button component for selecting stop reasons when stopping a stream.
 * Displays a button with dropdown arrow that opens a menu with stop reason options.
 * 
 * @param props - Component props
 * @returns React element rendering the stop reason button with dropdown
 */
const StopReasonButton: React.FC<IStopReasonButtonProps> = ({
  onSelect,
  disabled = false,
  className = '',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleButtonClick = (): void => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + DROPDOWN_OFFSET_TOP,
        left: rect.left,
      });
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (reason: StreamingStopReason): void => {
    setIsOpen(false);
    onSelect(reason);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const updatePosition = (): void => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + DROPDOWN_OFFSET_TOP,
          left: rect.left,
        });
      }
    };

    const handleScroll = updatePosition;
    const handleResize = updatePosition;

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      globalThis.window.addEventListener('scroll', handleScroll, true);
      globalThis.window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      globalThis.window.removeEventListener('scroll', handleScroll, true);
      globalThis.window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const renderDropdown = (): React.ReactPortal | null => {
    if (!isOpen || !buttonRef.current) return null;

    const dropdownStyle: React.CSSProperties = {
      position: 'fixed',
      top: position.top,
      left: position.left,
      zIndex: 9999,
      minWidth: DROPDOWN_MIN_WIDTH,
    };

    return createPortal(
      <div
        ref={dropdownRef}
        className="absolute z-10 mt-2 divide-y divide-gray-100 rounded-lg shadow-sm bg-(--color-tertiary) border border-gray-200"
        style={dropdownStyle}
      >
        <ul className="rounded-lg border-0 bg-(--color-tertiary) text-(--color-primary-dark)">
          {STOP_REASON_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className="w-full text-left px-4 py-2 rounded-lg transition-colors bg-(--color-tertiary) text-(--color-primary-dark) hover:bg-(--color-primary) flex flex-col"
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-sm opacity-75">{option.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={disabled}
        className={`w-full py-2 bg-(--color-tertiary) text-(--color-primary-dark) rounded-xl disabled:opacity-50 flex items-center justify-between px-4 ${className}`}
      >
        <span>{children}</span>
        <svg
          className="w-4 h-4"
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

      {renderDropdown()}
    </div>
  );
};

export default StopReasonButton;
export type { IStopReasonButtonProps, StopReasonOption } from './types/stopReasonButtonTypes';
export { StreamingStopReason as StopReason } from '@/modules/pso-streaming/enums/streamingStopReason';

