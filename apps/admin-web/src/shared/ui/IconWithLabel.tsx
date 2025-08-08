import React from 'react'

/**
 * Props for IconWithLabel component.
 */
export interface IconWithLabelProps {
  /** Image source URL or imported asset path */
  src: string
  /** Alt text for the image */
  alt?: string
  /** Tailwind classes for img size (e.g. "h-8 sm:h-10 md:h-12") */
  imgSize?: string
  /** Tailwind classes for text size (e.g. "text-xl sm:text-2xl md:text-3xl") */
  textSize?: string
  /** If true, wrapper div gets w-full h-full */
  fillContainer?: boolean
  /** Extra classes to add to the wrapper div */
  className?: string
  /** Text or nodes to render as label next to the icon */
  children: React.ReactNode
}

/**
 * IconWithLabel
 *
 * Renders an icon alongside a label, with configurable sizing and container behavior.
 * Ensures icon and text stay on the same line via flex and whitespace-nowrap.
 *
 * @param props.src Image source URL or import
 * @param props.alt Alt text for the image (defaults to 'Icon')
 * @param props.imgSize Tailwind classes for image size
 * @param props.textSize Tailwind classes for text size
 * @param props.fillContainer If true, wrapper gets w-full h-full
 * @param props.className Extra Tailwind classes for wrapper
 * @param props.children Label text or nodes
 * @returns JSX element with icon and label in one line
 */
const IconWithLabel: React.FC<IconWithLabelProps> = ({
  src,
  alt = 'Icon',
  imgSize = 'h-8 sm:h-10 md:h-12',
  textSize = 'text-xl sm:text-2xl md:text-3xl',
  fillContainer = false,
  className = 'flex items-center whitespace-nowrap mb-6 mt-8',
  children,
}) => {
  // Build wrapper classes
  const wrapperClasses = [
    className,
    fillContainer ? 'w-full h-full' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClasses}>
      <img
        src={src}
        alt={alt}
        className={`${imgSize} mr-3 flex-shrink-0`}
      />
      <span className={`montserrat-bold text-white ${textSize} whitespace-nowrap`}>
        {children}
      </span>
    </div>
  )
}

export default IconWithLabel
