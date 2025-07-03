import React, { useState, useRef, useEffect } from 'react';

/**
 * Represents a single option in the dropdown menu.
 */
export interface DropdownOption {
  /** Display label shown to the user */
  label: string;

  /** Value associated with the option */
  value: string | number;
}

/**
 * Props for the Dropdown component.
 */
interface DropdownProps {
  /**
   * List of options to display in the dropdown.
   */
  options: DropdownOption[];

  /**
   * Currently selected value.
   */
  value: string | number;

  /**
   * Callback function invoked when an option is selected.
   * @param value - The selected option value.
   */
  onSelect: (value: string | number) => void;

  /**
   * Optional default label to show when no option is selected.
   * Defaults to `'Select'`.
   */
  label?: string;

  /**
   * Additional class names to apply to the wrapper div.
   */
  className?: string;

  /**
   * Additional class names to apply to the dropdown button.
   */
  buttonClassName?: string;

  /**
   * Additional class names to apply to the dropdown menu.
   */
  menuClassName?: string;
}

/**
 * A reusable, customizable dropdown component that allows selecting a value from a list.
 * 
 * @component
 * @example
 * ```tsx
 * <Dropdown
 *   value={selected}
 *   onSelect={setSelected}
 *   label="Choose one"
 *   options={[
 *     { label: 'Option 1', value: 1 },
 *     { label: 'Option 2', value: 2 },
 *   ]}
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onSelect,
  label = 'Select',
  className = 'relative inline-block',
  buttonClassName = `
    flex items-center justify-between
    w-1/3
    px-4 py-2
    bg-[var(--color-tertiary)]
    text-[var(--color-white)]
    rounded-lg
    focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]  
    focus:ring-0
    focus:border-transparent
  `,
  menuClassName = `
    absolute left-0 mt-1 w-48
    bg-[var(--color-tertiary)]
    border border-gray-200
    rounded-lg shadow-lg
    z-50 w-1/3
  `,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(opt => opt.value === value)?.label ?? label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full ${className}`} ref={ref}>
      <button
        type="button"
        className={`
          text-[var(--color-primary-dark)] hover:bg--[var(--color-dark)] focus:ring-0 focus:outline-none
          font-medium rounded-full text-l px-5 py-2.5 text-center inline-flex items-center
          ${buttonClassName} w-11/12 w-58 bg-[var(--color-tertiary)]   focus:border-transparent
        `}
        onClick={() => setIsOpen(prev => !prev)}
      >
        {selected}
        <svg
          className="w-2.5 h-2.5 ms-3 ml-auto"
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
          className={`
            absolute z-10 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm  ${menuClassName} w-11/12 w-58 
            bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] hover:bg--[var(--color-dark)]  
          `}
        >
         <ul className=" rounded-lg bg-[var(--color-tertiary)] text-[var(--color-primary-dark)] border-0 rounded-lg">
  {options.map((option) => (
    <li key={option.value}>
      <button
        type="button"
        onClick={() => {
          onSelect(option.value);
          setIsOpen(false);
        }}
        className="
          w-full text-left px-4 py-2 
          bg-[var(--color-tertiary)] rounded-lg
          text-[var(--color-primary-dark)]
          hover:bg-[var(--color-primary)]
          transition-colors
        "
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
