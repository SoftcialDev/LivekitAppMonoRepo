export interface VideoCardProps {
  name: string;
  fullName?: string;
  email: string;
  onStop: (email: string) => void;
  onPlay: (email: string) => void;
  onChat: (email: string) => void;
  showHeader?: boolean;
  className?: string;
  accessToken?: string;
  roomName?: string;
  shouldStream?: boolean;
  connecting?: boolean;
  onToggle?: (email: string) => void;
  disableControls?: boolean
}
