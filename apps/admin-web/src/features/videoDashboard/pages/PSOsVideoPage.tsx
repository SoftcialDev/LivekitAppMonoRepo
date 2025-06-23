import React from 'react';
import { useHeader } from '../../../context/HeaderContext';
import monitorIcon from '@assets/monitor-icon.png';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePresence } from '../../navigation/hooks/usePresence';
import type { UserStatus } from 'src/features/navigation/types/types';
import VideoCard from '../components/VideoCard';
import { useVideoActions } from '../hooks/UseVideoAction';

/**
 * Extends UserStatus with an `isOnline` flag so we can
 * decide when to render a live video vs. placeholder.
 */
interface PSOWithStatus extends UserStatus {
  /** true if we should show `/video.mp4`, false otherwise */
  isOnline: boolean;
}

/**
 * PSOsPage component.
 *
 * - Sets the header title & icon via useHeader().
 * - Fetches live presence for the session user; if any PSOs are online,
 *   marks them as `isOnline` and shows them first.
 * - Falls back to a mock list of PSOs if none are online.
 * - Renders a responsive layout:
 *     • 1 PSO → full-screen card
 *     • 2 PSOs → two-column grid
 *     • 3 PSOs → two-plus-one layout
 *     • 4 PSOs → 2×2 grid
 *     • ≥5 PSOs → 3-column grid, centering the last row
 * - Delegates play/stop/chat handlers to useVideoActions().
 *
 * @returns The dashboard page showing PSO video cards.
 */
const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  const { account } = useAuth();
  console.log(account)
  const currentUser = account?.username ?? '';
  const { onlineUsers, loading, error } = usePresence(currentUser);
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  // Mock PSOs if none are live
  const mockUsers: PSOWithStatus[] = [
    { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
    { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
        { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
              { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
                  { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
                      { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
                          { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
                              { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
                                  { email: 'johann.granados@softcial.onmicrosoft.com', name: 'Johann Granados', isOnline: false },
  ];

  /**
   * Build the list of PSOs to display:
   * - If any real presence, show them first (isOnline=true),
   *   then include remaining mocks as offline.
   * - Otherwise, use all mocks.
   */
  const displayPSOs: PSOWithStatus[] = onlineUsers.length > 0
    ? [
        ...onlineUsers.map(u => ({ ...u, isOnline: true })),
        ...mockUsers.filter(m => !onlineUsers.some(x => x.email === m.email))
      ]
    : mockUsers;

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;
  if (displayPSOs.length === 0)
    return <div className="p-6 text-white">No PSOs to display</div>;

  const count = displayPSOs.length;

  return (
    <div className="flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
      {/* 1 PSO */}
      {count === 1 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-grow items-center justify-center p-4">
            <div className="w-11/12 h-full">
              <VideoCard
                name={displayPSOs[0].name}
                email={displayPSOs[0].email}
                videoSrc="/video.mp4"
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2 PSOs */}
      {count === 2 && (
        <div
          className="grid flex-grow gap-4"
          style={{
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: '1fr',
            height: '-webkit-fill-available',
          }}
        >
          {displayPSOs.map((u, i) => (
            <div key={u.email} className="w-full h-full">
              <VideoCard
                name={u.name}
                email={u.email}
                videoSrc={i === 0 ? '/video.mp4' : undefined}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 3 PSOs */}
      {count === 3 && (
        <div className="flex flex-col flex-1 min-h-0 p-2">
          <div className="flex flex-1 gap-2 min-h-0">
            {displayPSOs.slice(0, 2).map(u => (
              <div key={u.email} className="w-1/2 flex flex-col h-full">
                <VideoCard
                  name={u.name}
                  email={u.email}
                  videoSrc={u.isOnline ? '/video.mp4' : undefined}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  onChat={handleChat}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-1 justify-center mt-2 min-h-0">
            <div className="w-1/2 flex flex-col h-full">
              <VideoCard
                name={displayPSOs[2].name}
                email={displayPSOs[2].email}
                videoSrc={displayPSOs[2].isOnline ? '/video.mp4' : undefined}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4 PSOs */}
      {count === 4 && (
        <div
          className="grid flex-grow gap-4 justify-center content-center"
          style={{
            gridTemplateColumns: 'repeat(2, 0.4fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
          }}
        >
          {displayPSOs.map((u, i) => (
            <div key={u.email} className="w-full h-full">
              <VideoCard
                name={u.name}
                email={u.email}
                videoSrc={i === 0 && u.isOnline ? '/video.mp4' : undefined}
                onPlay={handlePlay}
                onStop={handleStop}
                onChat={handleChat}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 5+ PSOs */}
      {count >= 5 && (
        <div
          className="grid flex-grow gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '1fr',
          }}
        >
          {displayPSOs.map((u, i) => {
            const rows     = Math.ceil(count / 3);
            const rowIdx   = Math.floor(i / 3);
            const inLast   = rowIdx === rows - 1;
            const itemsLast= count - 3 * (rows - 1);
            const alignCls = inLast && itemsLast < 3
              ? 'justify-self-center'
              : 'justify-self-stretch';

            return (
              <div key={u.email} className={`w-full h-full ${alignCls}`}>
                <VideoCard
                  name={u.name}
                  email={u.email}
                  videoSrc={u.isOnline ? '/video.mp4' : undefined}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  onChat={handleChat}
                  className="w-full h-full"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PSOsPage;
