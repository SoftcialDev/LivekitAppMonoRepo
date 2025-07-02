import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHeader } from '../../../context/HeaderContext';
import { useVideoActions } from '../hooks/UseVideoAction';
import { useUserStream } from '../hooks/useUserStream';
import UserIndicator from '../../../components/UserIndicator';
import VideoCard from '../components/VideoCard';
import { usePresenceStore } from '@/stores/usePresenceStore';
import Loading from '@/components/Loading';

type RouteParams = { email?: string };

/**
 * UserVideoPage
 *
 * Displays a single user’s live video stream if they are currently streaming.
 *
 * Responsibilities:
 * 1. Reads the `:email` route param as the target’s email.
 * 2. Loads a one-time presence snapshot and opens a WebSocket
 *    connection for real-time streaming presence via the global store.
 * 3. Reads `streamingMap[targetEmail]` from the store to determine if the user
 *    is connected and streaming.
 * 4. Subscribes to LiveKit credentials with `useUserStream` for play/stop.
 * 5. Renders `<VideoCard>` with controls disabled if the target is offline,
 *    and updates the header with a `<UserIndicator>` reflecting live/offline status.
 *
 * @returns JSX element for the user video page
 */
const UserVideoPage: React.FC = () => {
  const { email: paramEmail } = useParams<RouteParams>();
  const targetEmail           = paramEmail ?? '';
  const { account }           = useAuth();
  const viewerEmail           = account?.username ?? '';

  // Presence store selectors
  const loadSnapshot        = usePresenceStore(s => s.loadSnapshot);
  const connectWebSocket    = usePresenceStore(s => s.connectWebSocket);
  const disconnectWebSocket = usePresenceStore(s => s.disconnectWebSocket);
  const streamingMap        = usePresenceStore(s => s.streamingMap);
  const presenceLoading     = usePresenceStore(s => s.loading);
  const onlineUsers  = usePresenceStore(s => s.onlineUsers);
  const isConnected  = onlineUsers.some(u => u.email === targetEmail);
  const presenceError       = usePresenceStore(s => s.error);

  // Initialize presence on mount
  useEffect(() => {
    loadSnapshot();
    connectWebSocket(viewerEmail);
    return () => {
      disconnectWebSocket();
    };
  }, [loadSnapshot, connectWebSocket, disconnectWebSocket, viewerEmail]);

  // Determine if target is live (connected via WS)
  const isLiveNow = Boolean(streamingMap[targetEmail]);

  // LiveKit credentials for play/stop
  const {
    accessToken,
    roomName,
    livekitUrl,
    loading: tokenLoading,
  } = useUserStream(viewerEmail, targetEmail);

  // Update header with user status indicator
  const headerProps = useMemo(() => ({
    title: targetEmail,
    iconNode: (
      <UserIndicator
        user={{
          email:           targetEmail,
          name:            targetEmail,
          fullName:        targetEmail,
          status:          isLiveNow ? 'online' : 'offline',
          azureAdObjectId: null,
        }}
        nameClass={isLiveNow ? 'text-green-400 font-bold' : 'text-white font-bold'}
      />
    ),
  }), [targetEmail, isLiveNow]);
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
              <div className="w-11/12 h-full mb-15">
                <VideoCard
                  name            ={targetEmail}
                  email           ={targetEmail}
                  accessToken     ={accessToken}
                  roomName        ={roomName}
                  livekitUrl      ={livekitUrl}
                  shouldStream    ={Boolean(accessToken)}
                  disableControls ={!isConnected}
                  connecting      ={tokenLoading}
                  onToggle        ={() =>
                    accessToken
                      ? handleStop(targetEmail)
                      : handlePlay(targetEmail)
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