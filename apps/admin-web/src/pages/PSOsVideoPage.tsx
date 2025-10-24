import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import monitorIcon from '@/shared/assets/monitor-icon.png';
import { useHeader } from '@/app/providers/HeaderContext';
import { useAuth } from '@/shared/auth/useAuth';
import { useUserInfo } from '@/shared/hooks/useUserInfo';
import { usePresenceStore } from '@/shared/presence/usePresenceStore';
import { Dropdown } from '@/shared/ui/Dropdown';
import Loading from '@/shared/ui/Loading';
import { SearchableDropdown } from '@/shared/ui/SearchableDropdown';
import SimpleVideoCard from './Video/components/SimpleVideoCard';
import { useIsolatedStreams } from './Video/hooks/useIsolatedStreams';
import { useVideoActions } from './Video/hooks/UseVideoAction';
import { useStablePSOs } from './Video/hooks/useStablePSOs';
import { useSupervisorChangeNotifications } from '@/shared/hooks/useSupervisorChangeNotifications';

/**
 * Gets user-friendly status message for streaming status
 * @param status - The streaming status from batch API
 * @param stopReason - The specific stop reason if available
 * @returns User-friendly status message
 */
function getStatusMessage(status: 'on_break' | 'disconnected' | 'offline', stopReason?: string | null): string {
  // If we have a specific stop reason, show a more detailed message
  if (stopReason) {
    switch (stopReason) {
      case 'QUICK_BREAK':
        return 'Quick Break (5 min)';
      case 'SHORT_BREAK':
        return 'Short Break (15 min)';
      case 'LUNCH_BREAK':
        return 'Lunch Break (30 min)';
      case 'EMERGENCY':
        return 'Emergency';
      case 'END_OF_SHIFT':
        return 'End of Shift';
      case 'COMMAND':
        return 'On Break';
      case 'DISCONNECT':
        return 'Disconnected';
      default:
        break; // Fall through to generic status
    }
  }
  
  // Fallback to generic status messages
  switch (status) {
    case 'on_break':
      return 'On Break';
    case 'disconnected':
      return 'Disconnected';
    case 'offline':
      return 'Offline';
    default:
      return '';
  }
}

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
  const { userInfo, loadUserInfo } = useUserInfo();
  const viewerEmail = account?.username?.toLowerCase() ?? '';
  const viewerId = account?.localAccountId; // Use localAccountId as viewerId
  const viewerRole = userInfo?.role;
  const viewerAzureAdObjectId = userInfo?.azureAdObjectId;
  
  // Force reload userInfo if role is wrong
  useEffect(() => {
    if (account && (!userInfo || userInfo.role === 'Employee')) {
      console.log('🔍 [PSOsVideoPage] Forcing userInfo reload...');
      // Clear localStorage first to force fresh API call
      localStorage.removeItem('userInfo');
      loadUserInfo();
    }
  }, [account, userInfo, loadUserInfo]);
  
  // Local state to track supervisor changes from WebSocket messages
  const [supervisorUpdates, setSupervisorUpdates] = useState<Record<string, { email: string; name: string }>>({});

  // Supervisor change notifications
  const handleSupervisorChange = useCallback((data: any) => {
    console.log(`🔄 [PSOsVideoPage] Supervisor change received:`, data);
    // Log the current state for debugging
    console.log(`🔄 [PSOsVideoPage] Current viewer: ${viewerEmail}, Role: ${viewerRole}`);
    console.log(`🔄 [PSOsVideoPage] Affected PSOs: ${data.psoNames.join(', ')}`);
    console.log(`🔄 [PSOsVideoPage] New supervisor: ${data.newSupervisorName}`);
    
    // Update local state with supervisor changes from WebSocket message
    const updates: Record<string, { email: string; name: string }> = {};
    data.psoEmails.forEach((psoEmail: string, index: number) => {
      updates[psoEmail] = {
        email: data.newSupervisorEmail,
        name: data.newSupervisorName
      };
    });
    
    console.log(`🔄 [PSOsVideoPage] Updating supervisor info:`, updates);
    console.log(`🔄 [PSOsVideoPage] Current supervisorUpdates before:`, supervisorUpdates);
    setSupervisorUpdates(prev => {
      const newState = { ...prev, ...updates };
      console.log(`🔄 [PSOsVideoPage] New supervisorUpdates after:`, newState);
      return newState;
    });
  }, [viewerEmail, viewerRole]);

  useSupervisorChangeNotifications(handleSupervisorChange, viewerEmail, viewerRole || undefined);

  /* ------------------------------------------------------------------ */
  /* 2️⃣ Presence data (already initialized by layout)                   */
  /* ------------------------------------------------------------------ */
  // ✅ OPTIMIZADO: Selectores específicos que NO causan re-renders globales
  const onlineUsers = usePresenceStore(useCallback(s => s.onlineUsers, []));
  const presenceLoading = usePresenceStore(useCallback(s => s.loading, []));
  const presenceError = usePresenceStore(useCallback(s => s.error, []));

  /* ------------------------------------------------------------------ */
  /* 3️⃣ Build PSO list - ESTABLE                                         */
  /* ------------------------------------------------------------------ */
  // ✅ OPTIMIZADO: Hook estable que NO causa re-renders innecesarios
  const allPsos = useStablePSOs(viewerEmail, viewerRole || undefined, viewerAzureAdObjectId);

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

  /* 
   * REMOVED: Auto-pruning of offline PSOs from localStorage
   * 
   * Previously, this effect would automatically remove PSOs from fixedEmails
   * when they went offline, which caused issues during temporary disconnections.
   * 
   * Now, PSOs remain in localStorage until the user explicitly deselects them,
   * providing better persistence across temporary network issues.
   * 
   * The displayList will still filter out offline PSOs for display purposes,
   * but the localStorage selection persists.
   */

  /* ------------------------------------------------------------------ */
  /* 6️⃣ LiveKit credentials & handlers                                  */
  /* ------------------------------------------------------------------ */
  const targetEmails = useMemo(() => {
    // Para todos los roles: mostrar todos los PSOs por defecto
    return allPsos.map(p => p.email.toLowerCase());
  }, [allPsos]);

  const rawCredsMap = useIsolatedStreams(viewerEmail, targetEmails);
  
  // Usar credsMap directamente sin memoización problemática
  const credsMap = rawCredsMap;
  
  const { handlePlay, handleStop, handleChat } = useVideoActions();
  
  // ✅ OPTIMIZACIÓN: Ya no necesitamos handlers aquí, el componente optimizado los maneja

  /* ------------------------------------------------------------------ */
  /* 7️⃣ Compute display list                                             */
  /* ------------------------------------------------------------------ */
const displayList = useMemo(() => {
  // 1️⃣ Filtrar por PSOs seleccionados en el dropdown (si hay selección)
  const base = fixedEmails.length > 0 
    ? allPsos.filter(p => fixedEmails.includes(p.email))
    : allPsos;

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
  }, [allPsos, fixedEmails, layout, credsMap]);


  if (presenceError) {
    return (
      <div className="p-6 text-red-500">
        Error: {presenceError}
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
      {presenceLoading ? (
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
              })(),
              paddingBottom:'260px' 
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
              // Wider dropdown when more than 5 cards are visible
              const portalMinWidthPx = displayList.length > 5 ? 360 : undefined;
              // ✅ CONNECTING: Si está cargando O si está online pero no tiene token (acaba de empezar a transmitir)
              const connecting: boolean = c.loading || (p.isOnline && !c.accessToken && Boolean(c.roomName));
              
              // ✅ Batch status (reason when there is no streaming session)
              const statusInfo = c.statusInfo;
              const statusMessage = statusInfo ? getStatusMessage(statusInfo.status, statusInfo.lastSession?.stopReason) : null;
              
              // ✅ REMOVED: No more loading/updating states to prevent connecting issues
              // const showLoading = !c.accessToken && !statusInfo && !c.loading;
              // const showUpdating = !c.accessToken && !statusInfo && p.isOnline;
              

              
              // Get updated supervisor info from WebSocket message if available
              const supervisorUpdate = supervisorUpdates[p.email];
              const currentSupervisorEmail = supervisorUpdate?.email || p.supervisorEmail;
              const currentSupervisorName = supervisorUpdate?.name || p.supervisorName;
              
              // Debug logging removed to reduce console spam
              
              return (
                <div
                  key={`${key}-${currentSupervisorEmail}`} // ✅ Include supervisor in key to force re-render
                  className={`video-card-wrapper w-full h-full relative z-10 ${alignClass}`}
                  style={itemStyle}
                >
                  <SimpleVideoCard
                    email={p.email}
                    name={`${p.fullName} — Supervisor: ${currentSupervisorName}`}
                    accessToken={c.accessToken}
                    roomName={c.roomName}
                    livekitUrl={c.livekitUrl}
                    shouldStream={isLive}
                    connecting={connecting}
                    disableControls={!p.isOnline || connecting}
                    className="w-full h-full"
                    statusMessage={statusMessage || undefined}
                    psoName={p.fullName} // PSO name for the selector
                    supervisorEmail={currentSupervisorEmail} // Updated supervisor email from WebSocket
                    supervisorName={currentSupervisorName} // Updated supervisor name from WebSocket
                    onSupervisorChange={(psoEmail, newSupervisorEmail) => {
                      console.log(`Supervisor changed for ${psoEmail} to ${newSupervisorEmail}`);
                      // TODO: Handle supervisor change - refresh data or update state
                    }}
                    portalMinWidthPx={portalMinWidthPx}
                    // Timer props
                    stopReason={statusInfo?.lastSession?.stopReason || null}
                    stoppedAt={statusInfo?.lastSession?.stoppedAt || null}
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
