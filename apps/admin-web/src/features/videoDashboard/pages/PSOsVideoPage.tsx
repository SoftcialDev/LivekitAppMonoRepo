import React, { useMemo } from 'react';
import { useHeader } from '../../../context/HeaderContext';
import monitorIcon from '@assets/monitor-icon.png';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePresence } from '../../navigation/hooks/usePresence';
import VideoCard from '../components/VideoCard';
import { useVideoActions } from '../hooks/UseVideoAction';
import { useMultiUserStreams } from '../hooks/useMultiUserStreams';
import Loading from '@/components/Loading';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a PSO (Primary Service Officer) with online/offline status.
 */
export interface PSOWithStatus {
  /** Canonical e-mail (primary key) */
  email: string;
  /** Full name ("Jane Doe"), falls back to name or email */
  fullName: string;
  /** Short label for the user (not used directly here) */
  name: string;
  /** "online" or "offline" */
  status: 'online' | 'offline';
  /** True if status is "online" */
  isOnline: boolean;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * Displays a grid of PSO video cards.
 * - Shows a loading overlay when presence is loading.
 * - Handles error and empty states.
 * - Arranges 1–4+ PSOs in responsive layouts.
 */
const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  const { account } = useAuth();
  const viewerEmail = account?.username ?? '';

  const { onlineUsers, offlineUsers, loading, error } = usePresence();

  const psos: PSOWithStatus[] = useMemo(() => {
    const beautify = (u: any): PSOWithStatus => ({
      ...u,
      fullName: u.fullName ?? u.name ?? u.email,
      isOnline: u.status === 'online',
    });
    return [...onlineUsers.map(beautify), ...offlineUsers.map(beautify)]
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [onlineUsers, offlineUsers]);

  const emails = useMemo(
    () => psos.map(p => p.email.toLowerCase()).sort(),
    [psos]
  );

  const credsMap = useMultiUserStreams(viewerEmail, emails);
  const { handlePlay, handleStop, handleChat } = useVideoActions();
  const count = psos.length;

  /**
   * Renders a single VideoCard for the given PSO.
   */
  const renderCard = (u: PSOWithStatus, extraClasses = '') => {
    const key = u.email.toLowerCase();
    const c = credsMap[key] ?? { loading: false };
    const isLive = Boolean(c.accessToken);
    const disabled = c.loading;

    return (
      <VideoCard
        key={u.email}
        name={u.fullName}
        email={u.email}
        accessToken={c.accessToken}
        roomName={c.roomName}
        livekitUrl={c.livekitUrl}
        shouldStream={isLive}
        connecting={disabled}
        onToggle={() => (isLive ? handleStop(u.email) : handlePlay(u.email))}
        onPlay={handlePlay}
        onStop={handleStop}
        onChat={handleChat}
        className={`w-full h-full ${extraClasses}`}
      />
    );
  };

  return (
    <div className="relative flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
      {loading && (
        <div className="absolute inset-0 z-10">
          <Loading action="is loading PSOs in charged" bgClassName="bg-[var(--color-primary-dark)]" />
        </div>
      )}

      {error && (
        <div className="p-6 text-red-500 z-0">
          Error: {error}
        </div>
      )}

      {!loading && !error && count === 0 && (
        <div className="p-6 text-white z-0">
          No PSOs to display
        </div>
      )}

      {!loading && !error && count > 0 && (
        <>
          {count === 1 && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-grow items-center justify-center p-4">
                <div className="w-11/12 h-full">
                  {renderCard(psos[0])}
                </div>
              </div>
            </div>
          )}

          {count === 2 && (
            <div
              className="grid flex-grow gap-4"
              style={{
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: '1fr',
                height: '-webkit-fill-available',
              }}
            >
              {psos.map(p => renderCard(p))}
            </div>
          )}

          {count === 3 && (
            <div className="flex flex-col flex-1 min-h-0 p-2">
              <div className="flex flex-1 gap-2 min-h-0">
                {psos.slice(0, 2).map(p => (
                  <div key={p.email} className="w-1/2 flex flex-col h-full">
                    {renderCard(p, 'flex-1')}
                  </div>
                ))}
              </div>
              <div className="flex flex-1 justify-center mt-2 min-h-0">
                <div className="w-1/2 flex flex-col h-full">
                  {renderCard(psos[2], 'flex-1')}
                </div>
              </div>
            </div>
          )}

          {count === 4 && (
            <div
              className="grid flex-grow gap-4 justify-center content-center"
              style={{
                gridTemplateColumns: 'repeat(2, 0.4fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
              }}
            >
              {psos.map(p => renderCard(p))}
            </div>
          )}

          {count >= 5 && (
            <div
              className="grid flex-grow gap-4"
              style={{
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridAutoRows: '1fr',
              }}
            >
              {psos.map((p, i) => {
                const rows = Math.ceil(count / 3);
                const rowIndex = Math.floor(i / 3);
                const inLastRow = rowIndex === rows - 1;
                const itemsInLast = count - 3 * (rows - 1);
                const alignClass =
                  inLastRow && itemsInLast < 3
                    ? 'justify-self-center'
                    : 'justify-self-stretch';
                return (
                  <div key={p.email} className={`w-full h-full ${alignClass}`}>
                    {renderCard(p)}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PSOsPage;
