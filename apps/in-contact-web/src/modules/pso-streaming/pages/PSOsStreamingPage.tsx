/**
 * @fileoverview PSOsStreamingPage
 * @summary Dashboard for viewing multiple PSO video streams
 * @description Displays grid of PSO video cards with streaming status and controls.
 * Renders a grid layout of PSO video streams with filtering, layout selection,
 * and real-time updates via WebSocket. Supports pinning specific PSOs and customizing
 * grid layout size. User preferences persist in localStorage.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useHeader } from '@/app/stores/header-store/hooks/useHeader';
import { useAuth, useUserInfo, useUserInfoStore } from '@/modules/auth';
import { usePresenceStore } from '@/modules/presence';
import { useSupervisorChange } from '@/modules/supervisor';
import { Dropdown, SearchableDropdown } from '@/ui-kit/dropdown';
import { Loading } from '@/ui-kit/feedback';
import { logError } from '@/shared/utils/logger';
import { SimpleVideoCard, VideoGridContainer, VideoGridItem } from '../components';
import { TalkNavigationGuard } from '../components/TalkNavigationGuard';
import { useIsolatedStreams, useStablePSOs, useVideoActions } from '../hooks';
import { useSupervisorsStore } from '../stores/supervisors-store';
import { useSnapshotReasonsStore } from '../stores/snapshot-reasons-store';
import { loadLayout, loadFixed, getStatusMessage, lsKey } from '../utils';
import { LAYOUT_OPTIONS, DEFAULT_LAYOUT } from '../constants';
import { StreamingStopReason } from '../enums';
import monitorIcon from '@/shared/assets/monitor-icon.png';
import type { LayoutOption } from '../types';

/**
 * PSOsStreamingPage component
 * 
 * Displays a grid of PSO video streams with:
 * - Real-time streaming status updates
 * - Filtering and pinning capabilities
 * - Customizable grid layout
 * - Supervisor change notifications
 */
const PSOsStreamingPage: React.FC = () => {
  useHeader({ title: 'PSOs Streaming', iconSrc: monitorIcon, iconAlt: 'PSOs Streaming' });

  const { account } = useAuth();
  const { userInfo } = useUserInfo();
  const viewerEmail = account?.username?.toLowerCase() ?? '';
  const viewerRole = userInfo?.role;
  const viewerAzureAdObjectId = userInfo?.azureAdObjectId;

  // Load user info if needed
  useEffect(() => {
    if (account && (!userInfo || userInfo.role === 'PSO')) {
      localStorage.removeItem('userInfo');
      const { loadUserInfo } = useUserInfoStore.getState();
      loadUserInfo();
    }
  }, [account, userInfo]);

  // Handle supervisor changes
  const [supervisorUpdates, setSupervisorUpdates] = useState<Record<string, { email: string; name: string }>>({});
  const lastSupervisorChange = useSupervisorChange();

  useEffect(() => {
    if (lastSupervisorChange) {
      const updates: Record<string, { email: string; name: string }> = {};
      lastSupervisorChange.psoEmails.forEach((psoEmail: string) => {
        updates[psoEmail] = {
          email: lastSupervisorChange.newSupervisorEmail,
          name: lastSupervisorChange.newSupervisorName
        };
      });
      setSupervisorUpdates(prev => ({ ...prev, ...updates }));
    }
  }, [lastSupervisorChange]);

  // Presence store access
  const presenceLoading = usePresenceStore((state) => state.loading);
  const presenceError = usePresenceStore((state) => state.error);

  // Load supervisors once at page level (shared across all SupervisorSelector components)
  useEffect(() => {
    const loadSupervisors = useSupervisorsStore.getState().loadSupervisors;
    loadSupervisors(true).catch((err) => {
      // Error is already logged in the store
      logError('[PSOsStreamingPage] Error loading supervisors', { error: err });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load snapshot reasons once at page level (shared across all VideoCard components)
  useEffect(() => {
    const loadSnapshotReasons = useSnapshotReasonsStore.getState().loadSnapshotReasons;
    loadSnapshotReasons(true).catch((err) => {
      // Error is already logged in the store
      logError('[PSOsStreamingPage] Error loading snapshot reasons', { error: err });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get stable list of PSOs
  const allPsos = useStablePSOs(viewerEmail, viewerRole || undefined, viewerAzureAdObjectId);

  // LocalStorage state for preferences
  const [fixedEmails, setFixedEmails] = useState<string[]>(() => loadFixed(viewerEmail));
  const [layout, setLayout] = useState<LayoutOption>(() => loadLayout(viewerEmail, DEFAULT_LAYOUT));

  // Reload preferences when viewer changes
  useEffect(() => {
    setFixedEmails(loadFixed(viewerEmail));
    setLayout(loadLayout(viewerEmail, DEFAULT_LAYOUT));
  }, [viewerEmail]);

  // Persist preferences to localStorage
  useEffect(() => {
    if (globalThis.window === undefined) return;
    globalThis.localStorage.setItem(lsKey(viewerEmail, 'fixed'), JSON.stringify(fixedEmails));
    globalThis.localStorage.setItem(lsKey(viewerEmail, 'layout'), String(layout));
  }, [viewerEmail, fixedEmails, layout]);

  // Get target emails for streaming
  const targetEmails = useMemo(() => {
    return allPsos.map(p => p.email.toLowerCase());
  }, [allPsos]);

  // Get streaming credentials for all PSOs
  const credsMap = useIsolatedStreams(viewerEmail, targetEmails);

  // Video actions (currently unused but may be needed in future)
  useVideoActions();

  // Calculate display list based on fixed emails and layout
  const displayList = useMemo(() => {
    const base = fixedEmails.length > 0 
      ? allPsos.filter(p => fixedEmails.includes(p.email.toLowerCase()))
      : allPsos;

    // Sort by streaming status (live first)
    const sortedByStreaming = [...base].sort((a, b) => {
      const aLive = Boolean(credsMap[a.email.toLowerCase()]?.accessToken);
      const bLive = Boolean(credsMap[b.email.toLowerCase()]?.accessToken);
      if (aLive !== bLive) return aLive ? -1 : 1;
      return a.email.localeCompare(b.email);
    });

    return sortedByStreaming.slice(0, layout);
  }, [allPsos, fixedEmails, layout, credsMap]);

  // Handle layout change
  const handleLayoutChange = useCallback((value: string | number) => {
    setLayout(Number(value) as LayoutOption);
  }, []);

  // Error state
  if (presenceError) {
    return (
      <div className="p-6 text-red-500">
        Error: {presenceError}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 h-full bg-(--color-primary-dark) p-10 overflow-x-hidden">
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
          onSelect={handleLayoutChange}
          menuClassName="bg-[var(--color-tertiary)] w-64"
        />
      </div>

      {(() => {
        if (presenceLoading) {
          return (
            <div className="flex flex-1 items-center justify-center">
              <Loading action="Loading PSOs…" />
            </div>
          );
        }
        if (displayList.length === 0) {
          return (
            <div className="flex flex-1 items-center justify-center text-white">
              <div className="max-w-2xl text-center px-4">
                No PSOs to display
              </div>
            </div>
          );
        }
        return (
        <VideoGridContainer itemCount={displayList.length}>
          {displayList.map((p, i) => {
            const key = p.email.toLowerCase();
            const c = credsMap[key] ?? { loading: false };
            const statusInfo = c.statusInfo;
            // shouldStream should be true only if accessToken exists AND there's no stopReason (stream is active)
            // If stopReason exists (e.g., DISCONNECT), shouldStream should be false to show timer instead of video
            const isLive = Boolean(c.accessToken) && !statusInfo?.lastSession?.stopReason;
            const portalMinWidthPx = displayList.length > 5 ? 360 : undefined;
            // connecting prop is only used for initial loading state (fetching token)
            // The actual connecting state for LiveKit connection is managed by useLiveKitRoomConnection hook
            const connecting = c.loading;

            const statusMessage = statusInfo 
              ? getStatusMessage(statusInfo.status, statusInfo.lastSession?.stopReason as StreamingStopReason | null) 
              : null;

            const supervisorUpdate = supervisorUpdates[p.email.toLowerCase()];
            const currentSupervisorEmail = supervisorUpdate?.email || p.supervisorEmail;
            const currentSupervisorName = supervisorUpdate?.name || p.supervisorName;

            return (
              <VideoGridItem
                key={key}
                itemIndex={i}
                totalCount={displayList.length}
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
                    // Supervisor changes are handled via WebSocket notifications
                  }}
                  portalMinWidthPx={portalMinWidthPx}
                  stopReason={statusInfo?.lastSession?.stopReason || null}
                  stoppedAt={statusInfo?.lastSession?.stoppedAt || null}
                />
              </VideoGridItem>
            );
          })}
        </VideoGridContainer>
        );
      })()}

      {/* Talk navigation guard - intercepts navigation during active talk sessions */}
      <TalkNavigationGuard />
    </div>
  );
};

export default PSOsStreamingPage;

