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
import { useTalkSessionNotifications } from './Video/hooks/useTalkSessionNotifications';

/**
 * Converts streaming status and stop reason to a user-friendly message
 * @param status - Streaming status from batch API
 * @param stopReason - Optional specific stop reason
 * @returns Formatted status message for display
 */
function getStatusMessage(status: 'on_break' | 'disconnected' | 'offline', stopReason?: string | null): string {
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
        break;
    }
  }
  
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

/**
 * Available grid layout options for PSO video cards
 */
const LAYOUT_OPTIONS = [1,2,3,4,5,6,9,12,20,200] as const;

/**
 * Prefix for localStorage keys scoped by viewer email
 */
const LS_PREFIX = 'psoDash';

/**
 * Generates a localStorage key scoped by viewer email
 * @param viewer - Viewer email address
 * @param what - Type of preference ('layout' or 'fixed')
 * @returns Scoped localStorage key
 */
const lsKey = (viewer: string, what: 'layout' | 'fixed'): string =>
  `${LS_PREFIX}:${what}:${viewer || 'anon'}`;

/**
 * Loads the saved layout preference from localStorage
 * @param viewer - Viewer email address
 * @param fallback - Default layout value if none is saved
 * @returns Saved layout value or fallback
 */
function loadLayout(viewer: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(lsKey(viewer, 'layout'));
  const n = raw == null ? fallback : Number(raw);
  return (LAYOUT_OPTIONS as readonly number[]).includes(n as any) ? n : fallback;
}

/**
 * Loads the list of pinned PSO emails from localStorage
 * @param viewer - Viewer email address
 * @returns Array of pinned PSO email addresses
 */
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
 * @fileoverview PSOsVideoPage - Dashboard for viewing multiple PSO video streams
 * @summary Displays grid of PSO video cards with streaming status and controls
 * @description Renders a grid layout of PSO video streams with filtering, layout selection,
 * and real-time updates via WebSocket. Supports pinning specific PSOs and customizing
 * grid layout size. User preferences persist in localStorage.
 */
const PSOsPage: React.FC = () => {
  useHeader({ title: 'PSOs', iconSrc: monitorIcon, iconAlt: 'PSOs' });

  const { account } = useAuth();
  const { userInfo, loadUserInfo } = useUserInfo();
  const viewerEmail = account?.username?.toLowerCase() ?? '';
  const viewerId = account?.localAccountId;
  const viewerRole = userInfo?.role;
  const viewerAzureAdObjectId = userInfo?.azureAdObjectId;
  
  useEffect(() => {
    if (account && (!userInfo || userInfo.role === 'Employee')) {
      localStorage.removeItem('userInfo');
      loadUserInfo();
    }
  }, [account, userInfo, loadUserInfo]);
  
  const [supervisorUpdates, setSupervisorUpdates] = useState<Record<string, { email: string; name: string }>>({});

  const handleSupervisorChange = useCallback((data: any) => {
    const updates: Record<string, { email: string; name: string }> = {};
    data.psoEmails.forEach((psoEmail: string) => {
      updates[psoEmail] = {
        email: data.newSupervisorEmail,
        name: data.newSupervisorName
      };
    });
    setSupervisorUpdates(prev => ({ ...prev, ...updates }));
  }, []);

  useSupervisorChangeNotifications(handleSupervisorChange, viewerEmail, viewerRole || undefined);

  useTalkSessionNotifications({
    psoEmail: viewerEmail,
    onTalkSessionStart: (message) => {
      console.log('[PSOsVideoPage] Talk session started:', message);
    },
    onTalkSessionEnd: () => {
      console.log('[PSOsVideoPage] Talk session ended');
    }
  });

  const onlineUsers = usePresenceStore(useCallback(s => s.onlineUsers, []));
  const presenceLoading = usePresenceStore(useCallback(s => s.loading, []));
  const presenceError = usePresenceStore(useCallback(s => s.error, []));

  const allPsos = useStablePSOs(viewerEmail, viewerRole || undefined, viewerAzureAdObjectId);

  const [fixedEmails, setFixedEmails] = useState<string[]>(() => loadFixed(viewerEmail));

  const [layout, setLayout] = useState<typeof LAYOUT_OPTIONS[number]>(
    () => loadLayout(viewerEmail, 9) as typeof LAYOUT_OPTIONS[number]
  );

  useEffect(() => {
    setFixedEmails(loadFixed(viewerEmail));
    setLayout(loadLayout(viewerEmail, 9) as typeof LAYOUT_OPTIONS[number]);
  }, [viewerEmail]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(lsKey(viewerEmail, 'fixed'), JSON.stringify(fixedEmails));
    window.localStorage.setItem(lsKey(viewerEmail, 'layout'), String(layout));
  }, [viewerEmail, fixedEmails, layout]);

  const targetEmails = useMemo(() => {
    return allPsos.map(p => p.email.toLowerCase());
  }, [allPsos]);

  const credsMap = useIsolatedStreams(viewerEmail, targetEmails);
  
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  const displayList = useMemo(() => {
    const base = fixedEmails.length > 0 
      ? allPsos.filter(p => fixedEmails.includes(p.email))
      : allPsos;

    const sortedByStreaming = [...base].sort((a, b) => {
      const aLive = Boolean(credsMap[a.email.toLowerCase()]?.accessToken);
      const bLive = Boolean(credsMap[b.email.toLowerCase()]?.accessToken);
      if (aLive !== bLive) return aLive ? -1 : 1;
      return a.email.localeCompare(b.email);
    });

    return sortedByStreaming.slice(0, layout);
  }, [allPsos, fixedEmails, layout, credsMap]);


  if (presenceError) {
    return (
      <div className="p-6 text-red-500">
        Error: {presenceError}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10 overflow-x-hidden">
      <div className="flex items-center mb-6 space-x-4">
        <SearchableDropdown<string>
          options={allPsos.map(p => ({
            label: p.fullName,
            value: p.email
          }))}
          selectedValues={fixedEmails}
          onSelectionChange={setFixedEmails}
          placeholder="Choose PSOs to display"
          showSelectAll={true}
        />
        <Dropdown
          options={LAYOUT_OPTIONS.map(n => ({ label: `Layout ${n} - cams`, value: n }))}
          value={layout}
          onSelect={v => setLayout(Number(v) as typeof LAYOUT_OPTIONS[number])}
          menuClassName="bg-[var(--color-tertiary)] w-64"
        />
      </div>

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
            const itemStyle: React.CSSProperties = {};

            if (displayList.length === 3 && i === 2) {
              itemStyle.gridColumn = '1 / -1';
              itemStyle.justifySelf = 'center';
              itemStyle.maxWidth = '66%';
              itemStyle.width = '100%';
            }

            if (displayList.length === 1) {
              itemStyle.gridColumn = '1 / -1';
              itemStyle.justifySelf = 'center';
              itemStyle.maxWidth = '80%';
              itemStyle.width = '100%';
            }

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
            const isLive = Boolean(c.accessToken);
            const portalMinWidthPx = displayList.length > 5 ? 360 : undefined;
            const connecting = c.loading || (p.isOnline && !c.accessToken && Boolean(c.roomName));
            
            const statusInfo = c.statusInfo;
            const statusMessage = statusInfo ? getStatusMessage(statusInfo.status, statusInfo.lastSession?.stopReason) : null;

            const supervisorUpdate = supervisorUpdates[p.email];
            const currentSupervisorEmail = supervisorUpdate?.email || p.supervisorEmail;
            const currentSupervisorName = supervisorUpdate?.name || p.supervisorName;
              
            return (
              <div
                key={`${key}-${currentSupervisorEmail}`}
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
                  psoName={p.fullName}
                  supervisorEmail={currentSupervisorEmail}
                  supervisorName={currentSupervisorName}
                  onSupervisorChange={(psoEmail, newSupervisorEmail) => {
                    console.log(`Supervisor changed for ${psoEmail} to ${newSupervisorEmail}`);
                  }}
                  portalMinWidthPx={portalMinWidthPx}
                  stopReason={statusInfo?.lastSession?.stopReason || null}
                  stoppedAt={statusInfo?.lastSession?.stoppedAt || null}
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
