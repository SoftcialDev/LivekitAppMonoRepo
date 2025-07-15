import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHeader } from '../../../context/HeaderContext';
import { useVideoActions } from '../hooks/UseVideoAction';
import { useUserStream } from '../hooks/useUserStream';
import UserIndicator from '../../../components/UserIndicator';
import VideoCard from '../components/VideoCard';
import { usePresenceStore } from '@/stores/usePresenceStore';
import Loading from '@/components/Loading';
import { getSupervisorForPso } from '@/services/userClient';

type RouteParams = { email?: string };

/**
 * UserVideoPage
 *
 * - Reads `:email` from the route and the current viewer’s email from context.
 * - Loads a one-time presence snapshot and opens a WebSocket for live updates.
 * - Determines whether the target is currently streaming.
 * - Fetches LiveKit credentials via `useUserStream`.
 * - Looks up the target’s supervisor (if any) via `getSupervisorForPso`.
 * - Updates the header to display “<userEmail> (Supervisor Name)” when available,
 *   and shows a live/offline status dot via `UserIndicator`.
 * - Renders a `<VideoCard>` with play/stop controls and disables them if offline.
 *
 * @returns A React element rendering the user’s video page with header and content.
 */
const UserVideoPage: React.FC = () => {
  const { email: paramEmail } = useParams<RouteParams>();
  const targetEmail           = paramEmail ?? '';
  const { account }           = useAuth();
  const viewerEmail           = account?.username ?? '';

  const [supervisorName, setSupervisorName] = useState<string | null>(null);

  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);
  const streamingMap        = usePresenceStore(s => s.streamingMap);
  const presenceLoading     = usePresenceStore(s => s.loading);
  const onlineUsers         = usePresenceStore(s => s.onlineUsers);
  const isConnected         = onlineUsers.some(u => u.email === targetEmail);
  const presenceError       = usePresenceStore(s => s.error);

  // Fetch initial presence and open WebSocket
  useEffect(() => {
    loadSnapshot();
    connectWebSocket(viewerEmail);
    return () => void disconnectWebSocket();
  }, [loadSnapshot, connectWebSocket, disconnectWebSocket, viewerEmail]);

  // Lookup the PSO’s supervisor once on mount
  useEffect(() => {
    if (!targetEmail) return;
    getSupervisorForPso(targetEmail)
      .then(res => {
        if ('supervisor' in res) {
          setSupervisorName(res.supervisor.fullName);
        }
      })
      .catch(() => {
        // ignore lookup failures
      });
  }, [targetEmail]);

  const isLiveNow = Boolean(streamingMap[targetEmail]);

  const {
    accessToken,
    roomName,
    livekitUrl,
    loading: tokenLoading,
  } = useUserStream(viewerEmail, targetEmail);

  // Compose header title: include supervisor if present
  const headerTitle = useMemo(
    () => supervisorName
      ? `${targetEmail} - supervisor ${supervisorName}`
      : targetEmail,
    [targetEmail, supervisorName]
  );

  // Provide header config to context
  const headerProps = useMemo(() => ({
    title: headerTitle,
    iconNode: (
      <UserIndicator
        user={{
          email:           targetEmail,
          name:            headerTitle,
          fullName:        headerTitle,
          status:          isLiveNow ? 'online' : 'offline',
          azureAdObjectId: null,
        }}
        nameClass={isLiveNow ? 'text-green-400 font-bold' : 'text-white font-bold'}
      />
    ),
  }), [headerTitle, targetEmail, isLiveNow]);
  useHeader(headerProps);

  const { handlePlay, handleStop, handleChat } = useVideoActions();

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-20 h-full">
      {presenceLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loading action="Loading presence…" />
        </div>
      ) : presenceError ? (
        <div className="p-6 text-red-500">Error: {presenceError}</div>
      ) : (
        <div className="flex flex-col flex-1 h-full p-10">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-grow items-center justify-center p-4">
              <div className="w-full h-full mb-15">
                <VideoCard
                  name            ={headerTitle}
                  email           ={targetEmail}
                  accessToken     ={accessToken}
                  roomName        ={roomName}
                  livekitUrl      ={livekitUrl}
                  shouldStream    ={Boolean(accessToken)}
                  disableControls ={!isConnected}
                  connecting      ={tokenLoading}
                  onToggle        ={() =>
                    accessToken ? handleStop(targetEmail) : handlePlay(targetEmail)
                  }
                  onPlay          ={handlePlay}
                  onStop          ={handleStop}
                  onChat          ={handleChat}
                  className       ="w-full h-full"
                  showHeader      ={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVideoPage;
