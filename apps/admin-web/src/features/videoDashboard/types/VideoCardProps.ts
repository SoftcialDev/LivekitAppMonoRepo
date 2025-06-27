export interface VideoCardProps {
  name: string;
  email: string;
  // optional MediaStream for direct streams (not used in admin dashboard)
  stream?: MediaStream;
  // admin dashboard won’t use videoSrc
  videoSrc?: string;
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;        // <— add this
  onPlay: (email: string) => void;
  onStop: (email: string) => void;
  onChat: (email: string) => void;
  showHeader?: boolean;
    className?: string;
  }