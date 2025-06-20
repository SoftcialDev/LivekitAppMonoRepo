// src/components/IconFactory.tsx
import React from 'react'

/** 
 * Carga todos los SVG en src/assets/icons como texto bruto.
 * Necesitas tener vite-plugin-static-copy o soporte raw import en Vite.
 */
const rawSvgs = import.meta.glob(
  '../assets/icons/*.svg',
  { eager: true, import: 'raw' }
) as Record<string, string>

/** Mapea "SignIn_icon" ➔ texto SVG limpio */
const iconMap: Record<string, string> = {}

Object.entries(rawSvgs).forEach(([path, content]) => {
  // 1) extrae el nombre de archivo sin extensión
  const fileName = path
    .split('/')
    .pop()!              // e.g. "SignIn_icon.svg"
    .replace('.svg', '') // => "SignIn_icon"

  // 2) quita cabecera XML y DOCTYPE
  let svg = content
    .replace(/<\?xml[\s\S]*?\?>/, '')
    .replace(/<!DOCTYPE[\s\S]*?>/, '')

  // 3) asegura que use currentColor
  svg = svg.replace(/fill="[^"]*"/g, 'fill="currentColor"')

  iconMap[fileName] = svg
})

interface IconFactoryProps {
  /** Nombre del SVG sin .svg, ej: "SignIn_icon" */
  name: string
  /** Clases Tailwind para tamaño, color, margen… */
  className?: string
}

export const IconFactory: React.FC<IconFactoryProps> = ({ name, className }) => {
  const svg = iconMap[name]
  if (!svg) {
    console.warn(`Icon "${name}" no encontrado`)
    return null
  }

  return (
    <span
      className={className}
      // Inyecta el SVG limpio inline
      dangerouslySetInnerHTML={{ __html: svg.trim() }}
    />
  )
}
