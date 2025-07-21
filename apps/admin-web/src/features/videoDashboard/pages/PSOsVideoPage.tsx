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

/* ------------------------------------------------------------------ */
/* LocalStorage helpers: persist dropdown selection + layout          */
/* ------------------------------------------------------------------ */
const LS_PREFIX = 'psoDash';
const lsKey = (viewer: string, what: 'layout' | 'fixed') =>
  `${LS_PREFIX}:${what}:${viewer || 'anon'}`;

function loadLayout(viewer: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(lsKey(viewer, 'layout'));
  const n = raw == null ? fallback : Number(raw);
  return (LAYOUT_OPTIONS as readonly number[]).includes(n as any) ? n : fallback;
}

function loadFixed(viewer: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(lsKey(viewer, 'fixed'));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * PSOsPage
 *
 * Shows **online** PSOs the viewer is authorized to see (per backend).
 * A viewer can pin specific PSOs via the dropdown; both the pinned list
 * (`fixedEmails`) and the chosen layout size persist in `localStorage`
 * (scoped by viewer email).
 *
 * If a pinned PSO goes offline, it simply disappears from the grid; we
 * prune it from the pinned list (and update `localStorage`) on the next
 * render — expected behavior.
 */
const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  const { account } = useAuth();
  const viewerEmail = account?.username?.toLowerCase() ?? '';

  /* ------------------------------------------------------------------ */
  /* 1️⃣ Authorized PSO metadata (email + supervisorName)                 */
  /* ------------------------------------------------------------------ */
  const {
    psos: myPsoMeta, // [{ email, supervisorName }, ...]
    loading: psosLoading,
    error: psosError,
    refetch: refetchPsos,
  } = useMyPsos();

  /* Refetch when viewer changes */
  useEffect(() => {
    refetchPsos();
  }, [viewerEmail, refetchPsos]);

  /* email(lower) -> supervisorName */
  const supMap = useMemo(
    () =>
      new Map(
        (myPsoMeta ?? [])
          .filter((p): p is { email: string; supervisorName: string } => !!p?.email)
          .map(p => [p.email.toLowerCase(), p.supervisorName])
      ),
    [myPsoMeta]
  );
  const allowedEmails = useMemo(() => new Set(supMap.keys()), [supMap]);

  /* ------------------------------------------------------------------ */
  /* 2️⃣ Presence snapshot + live updates                                */
  /* ------------------------------------------------------------------ */
  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);
  const onlineUsers         = usePresenceStore(s => s.onlineUsers);
  const offlineUsers        = usePresenceStore(s => s.offlineUsers); // loaded but not shown
  const presenceLoading     = usePresenceStore(s => s.loading);
  const presenceError       = usePresenceStore(s => s.error);

  useEffect(() => {
    loadSnapshot();
    connectWebSocket(viewerEmail);
    return () => disconnectWebSocket();
  }, [viewerEmail, loadSnapshot, connectWebSocket, disconnectWebSocket]);

  /* ------------------------------------------------------------------ */
  /* 3️⃣ Build PSO list from *online* presence, restricted to allowed     */
  /* ------------------------------------------------------------------ */
  const allPsos: PSOWithStatus[] = useMemo(() => {
    const decorate = (u: UserStatus): PSOWithStatus => ({
      email:    u.email,
      fullName: u.fullName ?? u.name ?? u.email,
      name:     u.fullName ?? u.name ?? u.email,
      status:   (u.status === 'online' ? 'online' : 'offline') as PSOWithStatus['status'],
      isOnline: u.status === 'online',
      supervisorName: supMap.get(u.email.toLowerCase()) ?? '—',
    });

    return onlineUsers
      .filter(u => allowedEmails.has(u.email.toLowerCase()))
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [onlineUsers, allowedEmails, supMap]);

  /* ------------------------------------------------------------------ */
  /* 4️⃣ Pinned PSOs (dropdown) — persisted                              */
  /* ------------------------------------------------------------------ */
const [fixedEmails, setFixedEmails] = useState<string[]>(() => loadFixed(viewerEmail));

  /* ------------------------------------------------------------------ */
  /* 5️⃣ Layout cap — persisted                                          */
  /* ------------------------------------------------------------------ */
const [layout, setLayout] = useState<typeof LAYOUT_OPTIONS[number]>(
  () => loadLayout(viewerEmail, 9) as typeof LAYOUT_OPTIONS[number]
);

  useEffect(() => {
    setFixedEmails(loadFixed(viewerEmail));
    setLayout(loadLayout(viewerEmail, 9) as typeof LAYOUT_OPTIONS[number]);
  }, [viewerEmail]);

  /* Reload prefs when viewer changes */
useEffect(() => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(lsKey(viewerEmail, 'fixed'), JSON.stringify(fixedEmails));
  window.localStorage.setItem(lsKey(viewerEmail, 'layout'), String(layout));
}, [viewerEmail, fixedEmails, layout]);

  /* Prune pinned PSOs that are no longer online (expected behavior) */
useEffect(() => {
  // 1) Espera a que la lista de PSOs y la presencia hayan terminado de cargar:
  if (psosLoading || presenceLoading) return;
  // 2) Si no hay PSOs online, no toques nada:
  if (allPsos.length === 0) return;

  const onlineSet = new Set(allPsos.map(p => p.email));
  setFixedEmails(prev => prev.filter(e => onlineSet.has(e)));
}, [allPsos, psosLoading, presenceLoading]);

  /* ------------------------------------------------------------------ */
  /* 6️⃣ LiveKit credentials & handlers                                  */
  /* ------------------------------------------------------------------ */
  const credsMap = useMultiUserStreams(
    viewerEmail,
    fixedEmails.length > 0
      ? allPsos.filter(p => fixedEmails.includes(p.email)).map(p => p.email.toLowerCase())
      : allPsos.map(p => p.email.toLowerCase())
  );
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  /* ------------------------------------------------------------------ */
  /* 7️⃣ Compute display list                                             */
  /* ------------------------------------------------------------------ */
const displayList = useMemo(() => {
  // 1️⃣ Selecciona fijos o todos
  const base = fixedEmails.length > 0
    ? allPsos.filter(p => fixedEmails.includes(p.email))
    : allPsos;

  // 2️⃣ Ordena por quienes tienen token de stream primero
  const sortedByStreaming = [...base].sort((a, b) => {
    const aLive = Boolean(credsMap[a.email.toLowerCase()]?.accessToken);
    const bLive = Boolean(credsMap[b.email.toLowerCase()]?.accessToken);
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    return 0;
  });

  // 3️⃣ Toma solo los primeros `layout`
  return sortedByStreaming.slice(0, layout);
}, [allPsos, fixedEmails, layout, credsMap]);

  const renderCard = (u: PSOWithStatus) => {
    const key        = u.email.toLowerCase();
    const c          = credsMap[key] ?? { loading: false };
    const isLive     = Boolean(c.accessToken);
    const connecting = c.loading;
    return (
      <VideoCard
        key={u.email}
        name={`${u.fullName} — Supervisor: ${u.supervisorName}`}
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
    return (
      <div className="p-6 text-red-500">
        Error: {psosError || presenceError}
      </div>
    );
  }

  return (
    // hide any horizontal overflow
    <div className="relative flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10 overflow-x-hidden">
      {/* Controls */}
      <div className="flex items-center mb-6 space-x-4">
        <SearchableDropdown<string>
          options={allPsos.map(p => ({
            label: p.fullName,  // keep simple (name only)
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
            <div
              className="grid flex-grow gap-4"
              style={{ gridTemplateColumns: 'repeat(2,1fr)', gridTemplateRows: '1fr' }}
            >
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
            <div
              className="grid gap-4 justify-center content-center"
              style={{ gridTemplateColumns:'repeat(2,0.4fr)', gridTemplateRows:'repeat(2,1fr)' }}
            >
              {displayList.map(renderCard)}
            </div>
          )}
          {displayList.length >= 5 && (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns:'repeat(3,1fr)', gridAutoRows:'1fr' }}
            >
              {displayList.map((p,i) => {
                const rows      = Math.ceil(displayList.length/3);
                const rowIndex  = Math.floor(i/3);
                const inLastRow = rowIndex===rows-1;
                const itemsLast = displayList.length - 3*(rows-1);
                const align     = inLastRow && itemsLast<3 ? 'justify-self-center' : 'justify-self-stretch';
                return (
                  <div key={p.email} className={`w-full h-full ${align}`}>
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
