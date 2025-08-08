import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  MouseEvent,
} from 'react';
import AddButton from './Buttons/AddButton';
import CancelButton from './Buttons/CancelButton';
import CancelIcon from './Buttons/CancelIcon';
import Loading from './Loading';

/**
 * Props for {@link AddModal}.
 */
export interface AddModalProps {
  /** Determines if the modal is visible. */
  open: boolean;
  /** Text to display in the modal header. */
  title: string;
  /** URL or import for the header icon. */
  iconSrc?: string;
  /** Alternative text for the header icon. */
  iconAlt?: string;
  /** Content to render inside the modal body. */
  children: ReactNode;
  /** Callback invoked when the modal is requested to close. */
  onClose: () => void;
  /** Callback invoked when the confirm action is triggered. */
  onConfirm: () => void;
  /** Label for the confirm button; defaults to `"Confirm"`. */
  confirmLabel?: string;
  /** Show loading overlay in the body area. */
  loading?: boolean;
  /** Text to display under the spinner. */
  loadingAction?: string;
  /**
   * Additional CSS class names appended to the default container classes.
   * Ignored if {@link classNameOverride} is provided.
   */
  className?: string;
  /** Whether to hide the footer with action buttons. */
  hideFooter?: boolean;
  /**
   * If provided, completely replaces the container classes.
   * Use this to fully override the default styling/layout.
   * When set, {@link className} is ignored.
   */
  classNameOverride?: string;
}

/**
 * Draggable modal dialog with a customizable header, body, and optional footer actions.
 *
 * @remarks
 * - The modal is absolutely positioned within a full-screen, fixed overlay and can be dragged
 *   by grabbing the header area.
 * - When `loading` is `true`, a loading overlay covers the body while preserving the header/footer.
 * - By default the component uses a set of container classes; you can:
 *   - Append more classes via `className`, or
 *   - Fully replace all classes via `classNameOverride`.
 *
 * @example
 * ```tsx
 * <AddModal
 *   open={isOpen}
 *   title="Submit"
 *   onClose={() => setOpen(false)}
 *   onConfirm={handleSubmit}
 * >
 *   <p>Form content…</p>
 * </AddModal>
 * ```
 *
 * @example
 * Full override of container class list:
 * ```tsx
 * <AddModal
 *   open
 *   title="Custom"
 *   onClose={() => {}}
 *   onConfirm={() => {}}
 *   classNameOverride="absolute bg-black text-white rounded-xl p-4 w-[600px]"
 * >
 *   Custom body
 * </AddModal>
 * ```
 */
const AddModal: React.FC<AddModalProps> = ({
  open,
  title,
  iconSrc,
  iconAlt,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  loading = false,
  loadingAction = 'Loading',
  className = '',
  hideFooter = false,
  classNameOverride,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  /**
   * Centers the modal on first open by measuring its dimensions and the viewport.
   */
  useEffect(() => {
    if (!open) return;
    const modal = modalRef.current;
    if (!modal) return;
    const { offsetWidth: w, offsetHeight: h } = modal;
    setPos({
      x: window.innerWidth / 2 - w / 2,
      y: window.innerHeight / 2 - h / 2,
    });
  }, [open]);

  /**
   * Starts dragging by capturing the mouse offset relative to the modal.
   */
  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // only left-click
    const modal = modalRef.current;
    if (!modal) return;
    const rect = modal.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
    e.preventDefault();
  };

  /**
   * Updates modal position while dragging using the stored offset.
   */
  const onMouseMove = (e: MouseEvent<Document>) => {
    if (!dragging || !offset) return;
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  /**
   * Ends the drag operation and clears the offset.
   */
  const onMouseUp = () => {
    setDragging(false);
    setOffset(null);
  };

  /**
   * Global listeners for drag move/up to allow dragging outside the modal bounds.
   */
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', onMouseMove as any);
      document.addEventListener('mouseup', onMouseUp);
    } else {
      document.removeEventListener('mousemove', onMouseMove as any);
      document.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove as any);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, offset]);

  if (!open) return null;

  // Default container classes (preserved unless fully overridden)
  const defaultContainer =
    `
      absolute
      bg-[var(--color-primary-light)]
      border-2 border-white
      rounded-lg shadow-xl
      w-[90%]
    `.replace(/\s+/g, ' ').trim();

  // Final container class calculation:
  // - If classNameOverride is provided, use that exactly.
  // - Else use defaults + optional className append.
  const containerClass =
    classNameOverride?.trim() || `${defaultContainer} ${className || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50">
      <div
        ref={modalRef}
        className={containerClass}
        style={{ left: pos.x, top: pos.y }}
      >
        {/* Header (drag handle) */}
        <div
          onMouseDown={onMouseDown}
          className="flex items-center justify-between px-6 py-4 cursor-move"
        >
          <div className="flex items-center space-x-2 text-white text-lg font-semibold">
            {iconSrc && <img src={iconSrc} alt={iconAlt} className="w-6 h-6" />}
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="leading-none" aria-label="Close">
            <CancelIcon />
          </button>
        </div>

        {/* Body */}
        <div className="relative px-6 py-2 text-white">
          {loading && (
            <div className="absolute inset-0 z-10">
              <Loading action={loadingAction} bgClassName="bg-[var(--color-primary)]" />
            </div>
          )}
          {children}
        </div>

        {/* Footer */}
        {!hideFooter && (
          <div className="flex justify-end items-center space-x-5 px-6 py-2 pb-10">
            <CancelButton onClick={onClose} />
            <AddButton label={confirmLabel} onClick={onConfirm} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddModal;
