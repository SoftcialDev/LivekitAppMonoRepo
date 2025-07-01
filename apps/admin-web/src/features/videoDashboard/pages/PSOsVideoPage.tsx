// src/features/video/pages/PSOsPage.tsx
import React, { useMemo } from 'react';
import { useHeader }  from '../../../context/HeaderContext';
import monitorIcon    from '@assets/monitor-icon.png';

import { useAuth }    from '../../auth/hooks/useAuth';
import { usePresence } from '../../navigation/hooks/usePresence';

import VideoCard      from '../components/VideoCard';
import { useVideoActions } from '../hooks/UseVideoAction';
import { useMultiUserStreams } from '../hooks/useMultiUserStreams';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export interface PSOWithStatus {
  /** canonical e-mail (primary key)                         */ email: string;
  /** “Jane Doe”, etc. (falls back to name)                  */ fullName: string;
  /** short name for label; we use fullName directly here    */ name: string;
  /** online/offline                                         */ status: 'online' | 'offline';
  /** convenience                                            */ isOnline: boolean;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

const PSOsPage: React.FC = () => {
  /* header icon & title */
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  /* viewer’s account (needed for PubSub auth) */
  const { account }   = useAuth();
  const viewerEmail   = account?.username ?? '';

  /* presence lists (REST + live WS diffs) */
  const { onlineUsers, offlineUsers, loading, error } = usePresence();

  /* merge + beautify once for render – memoised for perf */
  const psos: PSOWithStatus[] = useMemo(() => {
    const beautify = (u: any): PSOWithStatus => ({
      ...u,
      fullName: u.fullName ?? u.name ?? u.email,
      isOnline: u.status === 'online',
    });
    return [...onlineUsers.map(beautify), ...offlineUsers.map(beautify)]
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline)); // online first
  }, [onlineUsers, offlineUsers]);

  /* ▶️  memoize la lista de emails para que no cambie en cada render */
  const emails = useMemo(
    () => psos.map(p => p.email.toLowerCase()).sort(),
    [psos]
  );

  /* ▶️  new multi-stream hook – one WS, many PSOs */
  const credsMap = useMultiUserStreams(viewerEmail, emails);

  /* play / stop / chat actions (unchanged) */
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  // ──────────────────────────────────────────────────────────────── UI guards
  if (loading) return <div className="p-6 text-white">Loading PSOs…</div>;
  if (error)   return <div className="p-6 text-red-500">Error: {error}</div>;
  if (psos.length === 0)
    return <div className="p-6 text-white">No PSOs to display</div>;

  /* helper to render a <VideoCard> */
  const renderCard = (u: PSOWithStatus, extraClasses = '') => {
    const key = u.email.toLowerCase();
    const c = credsMap[key] ?? { loading: false };
    const isLive   = !!c.accessToken;
    const disabled = c.loading;

    return (
      <VideoCard
        key          ={u.email}
        name         ={u.fullName}
        email        ={u.email}
        accessToken  ={c.accessToken}
        roomName     ={c.roomName}
        livekitUrl   ={c.livekitUrl}
        shouldStream ={isLive}
        connecting   ={disabled}
        onToggle     ={() =>
          isLive ? handleStop(u.email) : handlePlay(u.email)
        }
        onPlay       ={handlePlay}
        onStop       ={handleStop}
        onChat       ={handleChat}
        className    ={`w-full h-full ${extraClasses}`}
      />
    );
  };

  /* how many cards to lay out? (Keeps your existing grids intact) */
  const count = psos.length;

  return (
    <div className="flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
      {/* 1 PSO */}
      {count === 1 && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-grow items-center justify-center p-4">
            <div className="w-11/12 h-full">
              {renderCard(psos[0])}
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
            gridTemplateRows:    '1fr',
            height:              '-webkit-fill-available',
          }}
        >
          {psos.map(p => renderCard(p))}
        </div>
      )}

      {/* 3 PSOs */}
      {count === 3 && (
        <div className="flex flex-col flex-1 min-h-0 p-2">
          <div className="flex flex-1 gap-2 min-h-0">
            {psos.slice(0, 2).map(p =>
              <div key={p.email} className="w-1/2 flex flex-col h-full">
                {renderCard(p, 'flex-1')}
              </div>
            )}
          </div>
          <div className="flex flex-1 justify-center mt-2 min-h-0">
            <div className="w-1/2 flex flex-col h-full">
              {renderCard(psos[2], 'flex-1')}
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
            gridTemplateRows:    'repeat(2, 1fr)',
          }}
        >
          {psos.map(p => renderCard(p))}
        </div>
      )}

      {/* 5+ PSOs */}
      {count >= 5 && (
        <div
          className="grid flex-grow gap-4"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows:        '1fr',
          }}
        >
          {psos.map((p, i) => {
            const rows        = Math.ceil(count / 3);
            const rowIndex    = Math.floor(i / 3);
            const inLastRow   = rowIndex === rows - 1;
            const itemsInLast = count - 3 * (rows - 1);
            const alignClass  = inLastRow && itemsInLast < 3
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
    </div>
  );
};

export default PSOsPage;
