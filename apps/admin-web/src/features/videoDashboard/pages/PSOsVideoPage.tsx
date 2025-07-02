// src/features/videoDashboard/pages/PSOsVideoPage.tsx
import React, { useEffect, useMemo } from 'react';
import { useHeader } from '../../../context/HeaderContext';
import monitorIcon from '@assets/monitor-icon.png';
import { useAuth } from '../../auth/hooks/useAuth';
import VideoCard from '../components/VideoCard';
import { useVideoActions } from '../hooks/UseVideoAction';
import { useMultiUserStreams } from '../hooks/useMultiUserStreams';
import Loading from '@/components/Loading';
import { useMyPsos } from '../../userManagement/hooks/useMyPsos';
import { usePresenceStore } from '@/stores/usePresenceStore';
import type { PSOWithStatus } from '../types/PsosWithStatus';
import type { UserStatus } from '@/features/navigation/types/types';

const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  const { account } = useAuth();
  const viewerEmail = account?.username?.toLowerCase() ?? '';

  // 1️⃣ Fetch the PSO list you supervise (or all, if admin)
  const {
    psos: myPsoEmails,
    loading: psosLoading,
    error: psosError,
    refetch: refetchPsos,
  } = useMyPsos();

  useEffect(() => {
    refetchPsos();
  }, [viewerEmail, refetchPsos]);

  // 2️⃣ Presence snapshot + live updates
  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);
  const onlineUsers         = usePresenceStore(s => s.onlineUsers);
  const offlineUsers        = usePresenceStore(s => s.offlineUsers);
  const presenceLoading     = usePresenceStore(s => s.loading);
  const presenceError       = usePresenceStore(s => s.error);

  useEffect(() => {
    loadSnapshot();
    connectWebSocket(viewerEmail);
    return () => { disconnectWebSocket(); };
  }, [viewerEmail, loadSnapshot, connectWebSocket, disconnectWebSocket]);

  // 3️⃣ Build a typed PSOWithStatus[] filtered by your PSOs
  const psos: PSOWithStatus[] = useMemo(() => {
    const mine = new Set(myPsoEmails.map(e => e.toLowerCase()));

    const decorate = (u: UserStatus): PSOWithStatus => ({
      email:    u.email,
      fullName: u.fullName ?? u.name ?? u.email,
      name:     u.fullName ?? u.name ?? u.email,
      status:   u.status === 'online' ? 'online' : 'offline',
      isOnline: u.status === 'online',
    });

    const onList = onlineUsers
      .filter(u => mine.has(u.email.toLowerCase()))
      .map(decorate);

    const offList = offlineUsers
      .filter(u => mine.has(u.email.toLowerCase()))
      .map(decorate);

    return [...onList, ...offList]
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [onlineUsers, offlineUsers, myPsoEmails]);

  const count = psos.length;

  // 4️⃣ LiveKit credentials & START/STOP commands
  const credsMap = useMultiUserStreams(
    viewerEmail,
    psos.map(p => p.email.toLowerCase())
  );
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  // 5️⃣ Render a single VideoCard
  const renderCard = (u: PSOWithStatus, extraClasses = '') => {
    const key = u.email.toLowerCase();
    const c = credsMap[key] ?? { loading: false };
    const isLive = Boolean(c.accessToken);

    // Only “Connecting…” while fetching the token for an online PSO
    const connecting     = u.isOnline && c.loading;
    // Disable button when offline or during the connect-fetch cycle
    const disableControls = !u.isOnline || connecting;

    return (
      <VideoCard
        key            ={u.email}
        name           ={u.fullName}
        email          ={u.email}
        accessToken    ={c.accessToken}
        roomName       ={c.roomName}
        livekitUrl     ={c.livekitUrl}
        shouldStream   ={isLive}
        connecting     ={connecting}
        disableControls={disableControls}
        onToggle       ={() => isLive ? handleStop(u.email) : handlePlay(u.email)}
        onPlay         ={handlePlay}
        onStop         ={handleStop}
        onChat         ={handleChat}
        className      ={`w-full h-full ${extraClasses}`}
      />
    );
  };

  // 6️⃣ Loading / error / empty states
  if (psosLoading || presenceLoading) {
    return (
      <div className="absolute inset-0 z-10">
        <Loading action="Loading PSOs…" bgClassName="bg-[var(--color-primary-dark)]" />
      </div>
    );
  }
  if (psosError || presenceError) {
    return <div className="p-6 text-red-500">Error: {psosError || presenceError}</div>;
  }
  if (count === 0) {
    return <div className="p-6 text-white">No PSOs to display</div>;
  }

  // 7️⃣ Responsive grid layout
  return (
    <div className="relative flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
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
            gridTemplateRows:    '1fr',
            height:              '-webkit-fill-available',
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
            gridTemplateRows:    'repeat(2, 1fr)',
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
