import React from 'react';
import { useParams } from 'react-router-dom';
import { useHeader } from '../../../context/HeaderContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePresence } from '../../navigation/hooks/usePresence';
import UserIndicator from '../../../components/UserIndicator';
import VideoCard from '../components/VideoCard';
import type { UserStatus } from '../../navigation/types/types';
import { useVideoActions } from '../hooks/UseVideoAction';

/**
 * Props extracted from the route.
 *
 * We tell React-Router that our only param is "username", so
 * useParams<'username'>() returns { username?: string }.
 */
type ParamKey = 'username';

/**
 * UserVideoPage
 *
 * - Reads the `:username` route param.
 * - Fetches current user’s presence list via usePresence.
 * - Finds the specified user in the online list (if any).
 * - Calls useHeader() to set the header title and icon.
 * - Renders a single VideoCard centered in the viewport:
 *   • If online, passes `/video.mp4` as videoSrc.
 *   • Otherwise, shows “No Stream”.
 * - Buttons call stub handlers for Start/Stop/Chat.
 *
 * Layout uses nested flex wrappers to center the VideoCard:
 * 1. `flex-1 min-h-0` to fill available space without overflow.
 * 2. `items-center justify-center` to center content.
 * 3. `max-w-3xl` to constrain width on large screens.
 *
 * @returns {JSX.Element}
 */
const UserVideoPage: React.FC = () => {
  // Extract `username` param
  const { username } = useParams<ParamKey>();
  const displayName = username ?? 'Unknown User';

  // Auth & presence
  const { account } = useAuth();
  const currentUser = account?.username ?? '';
  const { onlineUsers, loading, error } = usePresence(currentUser);

  // Find this user in the live-online list
  const matched = onlineUsers.find(u => u.name === displayName);
  const user: UserStatus = matched ?? { name: displayName, email: '' };
  const isOnline = Boolean(matched);

  // Set page header
  useHeader({
    title: user.name,
    iconNode: <UserIndicator user={user} 
       nameClass="text-white font-bold" />,
  });

  const { handlePlay, handleStop, handleChat } = useVideoActions();

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-20 w-full h-full">
      <div className="flex flex-1 min-h-0">
        {/* Centering wrapper: fills space and centers its content */}
        <div className="flex flex-1 items-center justify-center p-4 ">
          {/* Constrain max width and height */}
          <div className="w-full  h-full flex items-center justify-center">
            <VideoCard
              name={user.name}
              email={user.email}
              videoSrc={isOnline ? '/video.mp4' : undefined}
              onStop={handleStop}
              onPlay={handlePlay}
              onChat={handleChat}
              className="w-full h-full"
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserVideoPage;
