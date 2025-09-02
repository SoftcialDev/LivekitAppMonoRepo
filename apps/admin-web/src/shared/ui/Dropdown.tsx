import React, { useState, useRef, useEffect } from 'react';

/**
 * Represents a single option in the dropdown menu.
 */
export interface DropdownOption {
  /** Display label shown to the user. */
  label: string;
  /** Value associated with the option. */
  value: string | number;
}

/**
 * Props for the {@link Dropdown} component.
 */
export interface DropdownProps {
  /**
   * List of options to display in the dropdown.
   */
  options: DropdownOption[];

  /**
   * Currently selected value.
   */
  value: string | number;

  /**
   * Callback invoked when an option is selected.
   * @param value - The selected option value.
   */
  onSelect: (value: string | number) => void;

  /**
   * Default label shown when no option is selected.
   * @defaultValue "Select"
   */
  label?: string;

  /**
   * Additional class names applied to the outer wrapper.
   * @defaultValue "relative inline-block"
   */
  className?: string;

  /**
   * Additional class names applied to the toggle button.
   * These are appended to the defaults.
   */
  buttonClassName?: string;

  /**
   * Additional class names applied to the dropdown menu container.
   * These are appended to the defaults (unless {@link menuClassNameOverride} is provided).
   */
  menuClassName?: string;

  /**
   * Completely replaces the menu container class list.
   * When provided, {@link menuClassName} is ignored.
   */
  menuClassNameOverride?: string;

  /**
   * Overrides the background/text color classes used inside the dropdown
   * (menu container, list, and item base). Use any Tailwind classes
   * like `bg-[#764E9F] text-white` or `bg-white text-black`.
   *
   * @defaultValue "bg-[var(--color-tertiary)] text-[var(--color-primary-dark)]"
   */
  menuBgClassName?: string;

  /**
   * Optional node rendered **to the left** of the current label
   * inside the trigger button. Useful for a status dot or icon.
   * If omitted, nothing is rendered.
   */
  leftAdornment?: React.ReactNode;
}

/**
 * A reusable, customizable dropdown component that allows selecting a value from a list.
 *
 * @component
 *
 * @example
 * Basic usage
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
 *
 * @example
 * With a left status dot (e.g., CM availability)
 * ```tsx
 * <Dropdown
 *   value="ContactManager"
 *   onSelect={() => {}}
 *   options={[{ label: 'Contact Managers', value: 'ContactManager' }]}
 *   leftAdornment={<span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />}
/>
 * ```
 *
 * @example
 * Override only the menu background color (keeps default layout/spacing)
 * ```tsx
 * <Dropdown
 *   value={selected}
 *   onSelect={setSelected}
 *   options={opts}
 *   menuBgClassName="bg-[#764E9F] text-white"
/>
 * ```
 *
 * @example
 * Fully replace the menu container classes
 * ```tsx
 * <Dropdown
 *   value={selected}
 *   onSelect={setSelected}
 *   options={opts}
 *   menuClassNameOverride="absolute left-0 mt-2 w-64 bg-black text-white rounded-xl shadow-xl z-50"
/>
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value)?.label ?? label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build menu container classes:
  // - If menuClassNameOverride is provided, use it exactly.
  // - Otherwise, use defaults + menuClassName and inject menuBgClassName so background/text can be controlled.
  const defaultMenuContainer = `
    absolute left-0 mt-1
    border border-gray-200
    rounded-lg shadow-lg
    z-50 w-11/12
  `.replace(/\s+/g, ' ').trim();

  const menuContainerClass = (
    menuClassNameOverride?.trim() ||
    `${defaultMenuContainer} ${menuBgClassName} ${menuClassName}`.trim()
  )
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className={`w-full ${className}`} ref={ref}>
      <button
        type="button"
        className={`
          text-[var(--color-primary-dark)]
          focus:ring-0 focus:outline-none
          font-medium rounded-full text-l px-5 py-2.5 text-center
          inline-flex items-center gap-2
          w-11/12
          ${buttonClassName}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-2">
          {leftAdornment ? <span aria-hidden className="inline-flex">{leftAdornment}</span> : null}
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
        <div className={`
          absolute z-10 mt-2 divide-y divide-gray-100 rounded-lg shadow-sm
          w-11/12
          ${menuContainerClass}
        `}>
          <ul role="listbox" className={`rounded-lg border-0 ${menuBgClassName}`}>
            {options.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
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
                    hover:bg-[var(--color-primary)]
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
