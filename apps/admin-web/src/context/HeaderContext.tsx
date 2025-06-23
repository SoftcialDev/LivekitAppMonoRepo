import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'

/**
 * Information for the header: title text and optional icon data.
 * You may supply:
 *  - iconSrc (string URL/imported asset) and iconAlt, OR
 *  - iconNode: a ReactNode (e.g. a <UserIndicator />) for more flexible rendering.
 */
export interface HeaderInfo {
  /** Title text to display in the header. */
  title: string
  /** Optional image source for the icon (URL or imported asset). */
  iconSrc?: string
  /** Optional alt text for the icon; used if iconSrc is provided. */
  iconAlt?: string
  /**
   * Optional ReactNode to render as icon. If provided, this takes priority over iconSrc.
   * Example usage: `<UserIndicator user={...} ... />`.
   */
  iconNode?: ReactNode
}

/**
 * Shape of HeaderContext: current header info and a setter function.
 */
interface HeaderContextType {
  /** Current header information */
  header: HeaderInfo
  /**
   * Update header information.
   * @param info New HeaderInfo to apply.
   */
  setHeader: (info: HeaderInfo) => void
}

/**
 * Default header: empty title means pages/components should set their own.
 * You may adjust defaults (e.g., show app name here).
 */
const DEFAULT_HEADER: HeaderInfo = {
  title: '',
  iconSrc: undefined,
  iconAlt: undefined,
  iconNode: undefined,
}

/**
 * HeaderContext provides current header info and a setter.
 * Components using useHeader or Header will consume this context.
 */
export const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

/**
 * HeaderProvider wraps part of the app (e.g., inside Layout) so pages can set header info.
 *
 * Usage:
 * ```tsx
 * <HeaderProvider>
 *   <YourApp />
 * </HeaderProvider>
 * ```
 *
 * @param props.children React nodes under this provider.
 * @returns Provider wrapping children.
 */
export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [header, setHeader] = useState<HeaderInfo>(DEFAULT_HEADER)

  return (
    <HeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </HeaderContext.Provider>
  )
}

/**
 * Hook for components/pages to set header info.
 *
 * Sets the header to the given info when the component mounts, and resets to default on unmount.
 *
 * Example:
 * ```ts
 * useHeader({
 *   title: 'PSOs',
 *   iconSrc: monitorIcon,
 *   iconAlt: 'PSOs',
 * })
 * ```
 * Or, with a custom ReactNode icon:
 * ```ts
 * useHeader({
 *   title: 'Ron Angel',
 *   iconNode: <UserIndicator user={...} ... />,
 * })
 * ```
 *
 * @param info HeaderInfo object containing title and optional iconSrc/iconAlt/iconNode.
 * @throws Error if used outside of HeaderProvider.
 */
export function useHeader(info: HeaderInfo): void {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider')
  }
  const { setHeader } = context

  useEffect(() => {
    setHeader(info)
    return () => {
      // Reset to default when the component using this hook unmounts
      setHeader(DEFAULT_HEADER)
    }
    // Re-run if any field in info changes
  }, [info.title, info.iconSrc, info.iconAlt, info.iconNode, setHeader])
}
