import React, { ChangeEventHandler } from 'react';

export interface FormFieldProps {
  /** Unique identifier for the field. */
  id: string;
  /** Text label displayed above the field. */
  label: string;
  /**
   * Input type.
   * Supports native HTML inputs, <textarea>, or a styled file picker.
   * Defaults to "text".
   */
  type?: 'text'
    | 'number'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'textarea'
    | 'file';
  /** Current value (for file: the filename). */
  value?: string | number;
  /** Accepted file MIME types (only for `type="file"`). */
  accept?: string;
  /** Number of rows for `<textarea>`. */
  rows?: number;
  /**
   * Handler for changes on `<input>`, `<textarea>`, or file `<input>`.
   */
  onChange: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  /** Extra classes for the container `<div>`. */
  className?: string;
  /** Extra props to spread onto the `<input>`. */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Extra props to spread onto the `<textarea>`. */
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Label text for styled file-picker button. */
  fileButtonLabel?: string;
  /** Classes for styled file-picker button. */
  fileButtonClassName?: string;
  /** Classes for displayed file name. */
  fileNameClassName?: string;
}

/**
 * Renders a labelled form field:
 * - native `<input>` (text, number, date, time, datetime-local)
 * - `<textarea>`
 * - styled file-picker (hidden `<input type="file">` + `<label>` button)
 *
 * Removes default focus ring, centers text in number inputs,
 * and allows clearing initial zero.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  accept,
  rows,
  onChange,
  className = '',
  inputProps,
  textareaProps,
  fileButtonLabel = 'Browse…',
  fileButtonClassName = `
    px-4 py-2 bg-white text-gray-700 text-sm font-semibold
    border border-gray-300 rounded-md cursor-pointer
    hover:bg-gray-50 transition-colors
  `,
  fileNameClassName = `ml-4 text-sm text-gray-200`,
}) => {
  // Base styles: no black border or ring on focus
  const baseStyles = `
    mt-1 block w-full rounded-md border-gray-300 shadow-sm
    focus:outline-none focus:ring-0 focus:border-gray-300 sm:text-sm
    bg-[var(--color-primary)] text-center
  `;

  // For number inputs: center text and allow empty instead of "0"
  const inputStyles =
    type === 'number'
      ? `${baseStyles} text-center`
      : baseStyles;

  // Determine what value to display in the <input>
  let displayedValue: string | number | undefined = value;
  if (type === 'number') {
    displayedValue =
      value === undefined || value === 0 ? '' : value;
  }

  // FILE PICKER VARIANT
  if (type === 'file') {
    return (
      <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <input
          id={id}
          name={id}
          type="file"
          accept={accept}
          onChange={onChange as ChangeEventHandler<HTMLInputElement>}
          className="hidden"
          {...inputProps}
        />
        <label htmlFor={id} className={fileButtonClassName}>
          {fileButtonLabel}
        </label>
        {typeof value === 'string' && value && (
          <span className={fileNameClassName}>{value}</span>
        )}
      </div>
    );
  }

  // TEXTAREA VARIANT
  if (type === 'textarea') {
    return (
      <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <textarea
          id={id}
          name={id}
          rows={rows ?? 3}
          value={value as string}
          onChange={onChange as ChangeEventHandler<HTMLTextAreaElement>}
          className={baseStyles}
          {...textareaProps}
        />
      </div>
    );
  }

  // ALL OTHER INPUTS
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        accept={accept}
        value={displayedValue as string | number}
        onChange={onChange as ChangeEventHandler<HTMLInputElement>}
        className={inputStyles}
        {...inputProps}
      />
    </div>
  );
};
