// ToastIcons.tsx
import React from 'react'
import { ToastType } from './type'

/** Mapa de íconos SVG sin modificar su fill="currentColor" */
const ICONS: Record<ToastType, JSX.Element> = {
  success: (
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
    </svg>
  ),
}

/** Color para cada tipo de ícono (aplica a currentColor) */
const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-orange-500',
}

/** Props para el componente Toast */
export interface ToastProps {
  message: string
  type: ToastType
}

/**
 * Single toast notification UI.
 * - Fondo: var(--color-primary-dark)
 * - Borde: var(--color-secondary)
 * - Texto: var(--color-secondary), tamaño grande
 * - Padding aumentado, contenido inline-flex
 * - Ícono mantiene su fill y se colorea via currentColor
 */
export const Toast: React.FC<ToastProps> = ({ message, type }) => (
  <div
    role="alert"
    className="
      inline-flex items-center space-x-3
      px-10 py-3
      border-2 border-[var(--color-secondary)]
      bg-[var(--color-primary-dark)]
      text-[var(--color-secondary)] text-lg font-semibold
      rounded-full
      transition-colors
      hover:bg-[var(--color-primary-light)] hover:text-white
    "
  >
    <div className={ICON_COLOR[type]}>
      {ICONS[type]}
    </div>
    <span>{message}</span>
  </div>
)
