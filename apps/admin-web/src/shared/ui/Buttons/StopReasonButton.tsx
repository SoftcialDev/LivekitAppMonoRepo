import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type StopReason = 'SHORT_BREAK' | 'LUNCH_BREAK' | 'QUICK_BREAK' | 'EMERGENCY' | 'END_OF_SHIFT';

interface StopReasonOption {
  value: StopReason;
  label: string;
  description: string;
}

const STOP_REASON_OPTIONS: StopReasonOption[] = [
  {
    value: 'QUICK_BREAK',
    label: 'Quick',
    description: '5 minutes'
  },
  {
    value: 'SHORT_BREAK',
    label: 'Short',
    description: '15 minutes'
  },
  {
    value: 'LUNCH_BREAK',
    label: 'Lunch',
    description: '30 minutes'
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency',
    description: 'Urgent matter'
  },
  {
    value: 'END_OF_SHIFT',
    label: 'End of Shift',
    description: 'End of work day'
  }
];

interface StopReasonButtonProps {
  onSelect: (reason: StopReason) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A dropdown button component for selecting stop reasons
 * Displays a button with dropdown arrow that opens a menu with stop reason options
 */
const StopReasonButton: React.FC<StopReasonButtonProps> = ({
  onSelect,
  disabled = false,
  className = '',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleButtonClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 5,
        left: rect.left
      });
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (reason: StopReason) => {
    setIsOpen(false);
    onSelect(reason);
  };

  const handleClose = () => {
    setIsOpen(false);
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      // Update position when scrolling to keep dropdown attached to button
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 5,
          left: rect.left
        });
      }
    };

    const handleResize = () => {
      // Update position when window resizes
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 5,
          left: rect.left
        });
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const renderDropdown = () => {
    if (!isOpen || !buttonRef.current) return null;

    const dropdownStyle = {
      position: 'fixed' as const,
      top: position.top,
      left: position.left,
      zIndex: 9999,
      minWidth: '200px'
    };

    return createPortal(
      <div
        ref={dropdownRef}
        className="absolute z-10 mt-2 divide-y divide-gray-100 rounded-lg shadow-sm bg-[var(--color-tertiary)] border border-gray-200"
        style={dropdownStyle}
      >
        <ul role="listbox" className="rounded-lg border-0 bg-[var(--color-tertiary)] text-[var(--color-primary-dark)]">
          {STOP_REASON_OPTIONS.map((option) => (
            <li key={option.value} role="option">
              <button
                type="button"
                onClick={() => handleOptionSelect(option.value)}
                className="w-full text-left px-4 py-2 rounded-lg transition-colors bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] flex flex-col"
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
        className={`w-full py-2 bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] rounded-xl disabled:opacity-50 flex items-center justify-between px-4 ${className}`}
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
