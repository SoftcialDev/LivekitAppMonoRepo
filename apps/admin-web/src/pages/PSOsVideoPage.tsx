import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import monitorIcon from '@/shared/assets/monitor-icon.png';
import type { UserStatus } from '@/shared/types/UserStatus';
import { useHeader } from '@/app/providers/HeaderContext';
import { useAuth } from '@/shared/auth/useAuth';
import { usePresenceStore } from '@/shared/presence/usePresenceStore';
import { PSOWithStatus } from '@/shared/types/PsosWithStatus';
import { Dropdown } from '@/shared/ui/Dropdown';
import Loading from '@/shared/ui/Loading';
import { SearchableDropdown } from '@/shared/ui/SearchableDropdown';
import VideoCard from './Video/components/VideoCard';
import { useMultiUserStreams } from './Video/hooks/useMultiUserStreams';
import { useMyPsos } from './Video/hooks/useMyPsos';
import { useVideoActions } from './Video/hooks/UseVideoAction';


const LAYOUT_OPTIONS = [1,2,3,4,5,6,9,12,20,200] as const;

  
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
  
  // Memoized selectors to prevent unnecessary re-renders
  const onlineUsers = usePresenceStore(useCallback(s => s.onlineUsers, []));
  const offlineUsers = usePresenceStore(useCallback(s => s.offlineUsers, []));
  const presenceLoading = usePresenceStore(useCallback(s => s.loading, []));
  const presenceError = usePresenceStore(useCallback(s => s.error, []));

  useEffect(() => {
    loadSnapshot();
    connectWebSocket(viewerEmail);
    return () => disconnectWebSocket();
  }, [viewerEmail, loadSnapshot, connectWebSocket, disconnectWebSocket]);

  /* ------------------------------------------------------------------ */
  /* 3️⃣ Build PSO list                                                 */
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

    // Para todos los roles: mostrar todos los usuarios online con rol Employee
    const filteredUsers = onlineUsers.filter(u => 
      u.email.toLowerCase() !== viewerEmail.toLowerCase() &&
      u.role === 'Employee' // Solo empleados
    );

    const result = filteredUsers
      .map(decorate)
      .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
      
    return result;
  }, [onlineUsers, allowedEmails, supMap, viewerEmail]);

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
  const targetEmails = useMemo(() => {
    // Para todos los roles: mostrar todos los PSOs por defecto
    return allPsos.map(p => p.email.toLowerCase());
  }, [allPsos]);

  const rawCredsMap = useMultiUserStreams(viewerEmail, targetEmails);
  
  // Usar credsMap directamente sin memoización problemática
  const credsMap = rawCredsMap;
  
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  // Función estable para onToggle que no cambia entre renders
  const createToggleHandler = useCallback((email: string, isLive: boolean) => {
    return () => isLive ? handleStop(email) : handlePlay(email);
  }, [handleStop, handlePlay]);

  /* ------------------------------------------------------------------ */
  /* 7️⃣ Compute display list                                             */
  /* ------------------------------------------------------------------ */
const displayList = useMemo(() => {
  // 1️⃣ Para todos los roles: mostrar todos los PSOs disponibles
  const base = allPsos;

  // 2️⃣ Ordena por quienes tienen token de stream primero, con sort estable
  const sortedByStreaming = [...base].sort((a, b) => {
    const aLive = Boolean(credsMap[a.email.toLowerCase()]?.accessToken);
    const bLive = Boolean(credsMap[b.email.toLowerCase()]?.accessToken);
    if (aLive !== bLive) return aLive ? -1 : 1;
    return a.email.localeCompare(b.email); // stable tie-breaker
  });

  // 3️⃣ Toma solo los primeros `layout`
  const result = sortedByStreaming.slice(0, layout);
  return result;
  }, [allPsos, layout, credsMap]);


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
          
          menuClassName="bg-[var(--color-tertiary)] w-64"
        />
      </div>

      {/* Content */}
      {(psosLoading || presenceLoading) ? (
        <div className="flex flex-1 items-center justify-center">
          <Loading action="Loading PSOs…" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-white">
          <div className="max-w-2xl text-center px-4">
            No PSOs to display
          </div>
        </div>
      ) : (
        <>
          {/* Layout unificado con estructura estable */}
          <div 
            className="video-grid-container grid gap-4 flex-grow transition-all duration-300 ease-in-out"
            style={{
              gridTemplateColumns: (() => {
                const cols = displayList.length === 1 ? 1 :
                  displayList.length === 2 ? 2 :
                  displayList.length === 3 ? 2 :
                  displayList.length === 4 ? 2 : 3;
                return `repeat(${cols}, minmax(0,1fr))`;
              })()
            }}
          >
            {displayList.map((p, i) => {
              // Calcular estilo por card - sin wrappers condicionales
              const itemStyle: React.CSSProperties = {};

              // 3 items: hacer el último de ancho completo centrado
              if (displayList.length === 3 && i === 2) {
                itemStyle.gridColumn = '1 / -1';
                itemStyle.justifySelf = 'center';
                itemStyle.maxWidth = '66%';
                itemStyle.width = '100%';
              }

              // 1 item: ancho completo pero limitar ancho del card
              if (displayList.length === 1) {
                itemStyle.gridColumn = '1 / -1';
                itemStyle.justifySelf = 'center';
                itemStyle.maxWidth = '80%';
                itemStyle.width = '100%';
              }

              // Centrado de última fila cuando items < cols
              const cols = displayList.length === 1 ? 1 :
                displayList.length === 2 ? 2 :
                displayList.length === 3 ? 2 :
                displayList.length === 4 ? 2 : 3;
              const rows = Math.ceil(displayList.length / 3);
              const rowIndex = Math.floor(i / 3);
              const inLastRow = rowIndex === rows - 1;
              const itemsLast = displayList.length - 3 * (rows - 1);
              const shouldCenter = cols === 3 && inLastRow && itemsLast > 0 && itemsLast < 3;
              const alignClass = shouldCenter ? 'justify-self-center' : 'justify-self-stretch';

              const key = p.email.toLowerCase();
              const c = credsMap[key] ?? { loading: false };
              const isLive: boolean = Boolean(c.accessToken);
              // ✅ CONNECTING: Si está cargando O si está online pero no tiene token (acaba de empezar a transmitir)
              const connecting: boolean = c.loading || (p.isOnline && !c.accessToken && Boolean(c.roomName));

              
              return (
                <div
                  key={key} // ✅ clave estable ÚNICAMENTE aquí
                  className={`video-card-wrapper w-full h-full ${alignClass}`}
                  style={itemStyle}
                >
                  <VideoCard
                    // 🚫 sin key aquí para evitar re-mounts por claves anidadas
                    name={`${p.fullName} — Supervisor: ${p.supervisorName}`}
                    email={p.email}
                    accessToken={c.accessToken}
                    roomName={c.roomName}
                    livekitUrl={c.livekitUrl}
                    shouldStream={isLive}
                    connecting={connecting}
                    disableControls={!p.isOnline || connecting}
                    onToggle={createToggleHandler(p.email, isLive)}
                    onPlay={handlePlay}
                    onStop={handleStop}
                    onChat={handleChat}
                    className="w-full h-full"
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PSOsPage;
