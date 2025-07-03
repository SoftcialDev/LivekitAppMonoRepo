import React, { useEffect, useMemo, useState } from 'react';
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
import { SearchableDropdown } from '@components/SearchableDropdown';
import { Dropdown } from '@/components/Dropdown';

const LAYOUT_OPTIONS = [1,2,3,4,5,6,7,8,9] as const;

const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  const { account } = useAuth();
  const viewerEmail = account?.username?.toLowerCase() ?? '';

  // 1️⃣ PSO emails you supervise
  const {
    psos: myPsoEmails,
    loading: psosLoading,
    error: psosError,
    refetch: refetchPsos,
  } = useMyPsos();
  useEffect(() => { refetchPsos(); }, [viewerEmail, refetchPsos]);

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
    return () => disconnectWebSocket();
  }, [viewerEmail, loadSnapshot, connectWebSocket, disconnectWebSocket]);

  // 3️⃣ Build full PSO list (online + offline)
  const allPsos: PSOWithStatus[] = useMemo(() => {
    const mine = new Set(myPsoEmails.map(e => e.toLowerCase()));
    const decorate = (u: UserStatus): PSOWithStatus => ({
      email:    u.email,
      fullName: u.fullName ?? u.name ?? u.email,
      name:     u.fullName ?? u.name ?? u.email,
      status:   u.status === 'online' ? 'online' : 'offline',
      isOnline: u.status === 'online',
    });
   return onlineUsers
    .filter(u => mine.has(u.email.toLowerCase()))
    .map(decorate)
    // (we drop the offlineUsers portion entirely)
    .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [onlineUsers, myPsoEmails]);

  // 4️⃣ Controlled selection of “fixed” PSOs via dropdown
  const [fixedEmails, setFixedEmails] = useState<string[]>([]);

  // 5️⃣ Layout cap
  const [layout, setLayout] = useState<typeof LAYOUT_OPTIONS[number]>(9);

  // 6️⃣ Compute display list
  const displayList = useMemo(() => {
    if (fixedEmails.length > 0) {
      // show exactly the checked ones (up to the layout limit)
      return allPsos
        .filter(p => fixedEmails.includes(p.email))
        .slice(0, layout);
    }
    // otherwise fill from top of full list
    return allPsos.slice(0, layout);
  }, [allPsos, fixedEmails, layout]);

  // 7️⃣ LiveKit credentials & handlers
  const credsMap = useMultiUserStreams(
    viewerEmail,
    displayList.map(p => p.email.toLowerCase())
  );
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  const renderCard = (u: PSOWithStatus) => {
    const key        = u.email.toLowerCase();
    const c          = credsMap[key] ?? { loading: false };
    const isLive     = Boolean(c.accessToken);
    const connecting = c.loading;
    return (
      <VideoCard
        key={u.email}
        name={u.fullName}
        email={u.email}
        accessToken={c.accessToken}
        roomName={c.roomName}
        livekitUrl={c.livekitUrl}
        shouldStream={isLive}
        connecting={connecting}
        disableControls={!u.isOnline || connecting}
        onToggle={() => isLive ? handleStop(u.email) : handlePlay(u.email)}
        onPlay={handlePlay}
        onStop={handleStop}
        onChat={handleChat}
        className="w-full h-full"
      />
    );
  };

  if (psosError || presenceError) {
    return <div className="p-6 text-red-500">
      Error: {psosError || presenceError}
    </div>;
  }

  return (
    // hide any horizontal overflow
    <div className="relative flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10 overflow-x-hidden">
      {/* Controls */}
      <div className="flex items-center mb-6 space-x-4">
        <SearchableDropdown<string>
          options={allPsos.map(p => ({
            label: p.fullName,  // use fullName now!
            value: p.email
          }))}
          selectedValues={fixedEmails}
          onSelectionChange={setFixedEmails}
          placeholder="Choose PSOs to display"
          
        />
        <Dropdown
          options={LAYOUT_OPTIONS.map(n => ({ label: `Layout ${n} - cams`, value: n }))}
          value={layout}
          onSelect={v => setLayout(Number(v) as typeof LAYOUT_OPTIONS[number])}
          className=""
          buttonClassName=""
          menuClassName="bg-[var(--color-tertiary)]"
        />
      </div>

      {/* Content */}
      {(psosLoading || presenceLoading) ? (
        <div className="flex flex-1 items-center justify-center">
          <Loading action="Loading PSOs…" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-white">
          No PSOs to display
        </div>
      ) : (
        <>
          {displayList.length === 1 && (
            <div className="flex items-center justify-center p-4">
              <div className="w-11/12 max-w-5xl">
                {renderCard(displayList[0])}
              </div>
            </div>
          )}
          {displayList.length === 2 && (
            <div className="grid flex-grow gap-4"
                 style={{ gridTemplateColumns: 'repeat(2,1fr)', gridTemplateRows: '1fr' }}>
              {displayList.map(renderCard)}
            </div>
          )}
          {displayList.length === 3 && (
            <div className="flex flex-col flex-1 p-2">
              <div className="flex gap-2">
                {displayList.slice(0,2).map(renderCard)}
              </div>
              <div className="flex justify-center mt-2">
                <div className="w-1/2">{renderCard(displayList[2])}</div>
              </div>
            </div>
          )}
          {displayList.length === 4 && (
            <div className="grid gap-4 justify-center content-center"
                 style={{ gridTemplateColumns:'repeat(2,0.4fr)', gridTemplateRows:'repeat(2,1fr)' }}>
              {displayList.map(renderCard)}
            </div>
          )}
          {displayList.length >= 5 && (
            <div className="grid flex-grow gap-4"
                 style={{ gridTemplateColumns:'repeat(3,1fr)', gridAutoRows:'1fr' }}>
              {displayList.map((p,i) => {
                const rows      = Math.ceil(displayList.length/3);
                const rowIndex  = Math.floor(i/3);
                const inLastRow = rowIndex===rows-1;
                const itemsLast = displayList.length - 3*(rows-1);
                const align     = inLastRow && itemsLast<3 ? 'justify-self-center' : 'justify-self-stretch';
                return <div key={p.email} className={`w-full h-full ${align}`}>
                  {renderCard(p)}
                </div>;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PSOsPage;
