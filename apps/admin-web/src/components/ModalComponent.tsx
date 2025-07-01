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
import Loading from '@/components/Loading';

export interface AddModalProps {
  /** Determines if the modal is visible */
  open: boolean;
  /** Text to display in the modal header */
  title: string;
  /** URL or import for the header icon */
  iconSrc?: string;
  /** Alternative text for the header icon */
  iconAlt?: string;
  /** Content to render inside the modal body */
  children: ReactNode;
  /** Callback invoked when the modal is requested to close */
  onClose: () => void;
  /** Callback invoked when the confirm action is triggered */
  onConfirm: () => void;
  /** Label for the confirm button; defaults to "Confirm" */
  confirmLabel?: string;
  /** Show loading overlay in the body area */
  loading?: boolean;
  /** Text to display under the spinner */
  loadingAction?: string;
}

/**
 * Draggable modal dialog with custom header, body, and footer actions.
 * Shows a loading overlay over the body when `loading` is true.
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
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

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

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const modal = modalRef.current;
    if (!modal) return;
    const rect = modal.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent<Document>) => {
    if (!dragging || !offset) return;
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const onMouseUp = () => {
    setDragging(false);
    setOffset(null);
  };

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

  return (
    <div className="fixed inset-0 z-50">
      <div
        ref={modalRef}
        className="
          absolute
          bg-[var(--color-primary-light)]
          border-2 border-white
          rounded-lg shadow-xl
          w-[90%]
        "
        style={{ left: pos.x, top: pos.y }}
      >
        <div
          onMouseDown={onMouseDown}
          className="flex items-center justify-between px-6 py-4 cursor-move"
        >
          <div className="flex items-center space-x-2 text-white text-lg font-semibold">
            {iconSrc && <img src={iconSrc} alt={iconAlt} className="w-6 h-6" />}
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="leading-none">
            <CancelIcon />
          </button>
        </div>

        <div className="relative px-6 py-2 text-white">
          {loading && (
            <div className="absolute inset-0 z-10">
              <Loading action={loadingAction} bgClassName="bg-[var(--color-primary)]" />
            </div>
          )}
          {children}
        </div>

        <div className="flex justify-end items-center space-x-5 px-6 py-2 pb-10">
          <CancelButton onClick={onClose} />
          <AddButton label={confirmLabel} onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
};

export default AddModal;
