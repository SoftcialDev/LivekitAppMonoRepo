export interface VideoCardProps {
  /** Display name of the user (fullName from UserStatus). */
  name: string;
  /** The user’s email address (used as their LiveKit identity). */
  email: string;
  /** Optional MediaStream for local or pre-fetched video. */
  stream?: MediaStream;
  /** Optional local video URL (e.g. for mock/demo playback). */
  videoSrc?: string;
  /** Called when the user clicks “Stop” on an active video. */
  onStop: (email: string) => void;
  /** Called when the user clicks “Play” on an inactive video. */
  onPlay: (email: string) => void;
  /** Called when the user clicks “Chat” on this card. */
  onChat: (email: string) => void;
  /** Hide the header (avatar + name) when false. Defaults to true. */
  showHeader?: boolean;
  /** Additional Tailwind CSS classes to apply to the root. */
  className?: string;
  /**
   * LiveKit access token (JWT) for joining the room.
   * If provided alongside `roomName`, this card will connect to LiveKit
   * and render the remote participant’s video.
   */
  accessToken?: string;
  /**
   * LiveKit room name (must match the participant’s identity).
   * Used with `accessToken` to join & subscribe.
   */
  roomName?: string;
}
