export interface VideoCardProps {
  name: string
  email: string

  // optional MediaStream for direct streams (not used in admin dashboard)
  stream?: MediaStream

  // admin dashboard won’t use videoSrc
  videoSrc?: string
connecting?:   boolean
  accessToken?: string
  roomName?: string
  livekitUrl?: string

  /** indica si debe conectarse el vídeo */
  shouldStream?: boolean
  /** callback al clicar Play/Stop para refrescar token */
  onToggle?: (email: string) => void

  onPlay: (email: string) => void
  onStop: (email: string) => void
  onChat: (email: string) => void

  showHeader?: boolean
  className?: string
}
