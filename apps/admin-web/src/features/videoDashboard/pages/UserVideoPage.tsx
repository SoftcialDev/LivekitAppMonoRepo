import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePresence } from '../../navigation/hooks/usePresence';
import { useHeader } from '../../../context/HeaderContext';
import { useVideoActions } from '../hooks/UseVideoAction';
import { useUserStream } from '../hooks/useUserStream';
import UserIndicator from '../../../components/UserIndicator';
import VideoCard from '../components/VideoCard';

type RouteParams = { email?: string };

/**
 * UserVideoPage
 *
 * Shows a single user’s live video stream if they are online.
 *
 * Responsibilities:
 * 1. Reads the `:email` route param as the target’s email.
 * 2. Uses `usePresence()` to get a presence snapshot and determine if the
 *    target user is currently live.
 * 3. Uses `useUserStream(viewerEmail, targetEmail)` to subscribe to Web PubSub
 *    events and fetch LiveKit credentials when the target starts/stops streaming.
 * 4. Renders `<VideoCard>` with the fetched credentials (or a Play button).
 */
const UserVideoPage: React.FC = () => {
  const { email: paramEmail } = useParams<RouteParams>();
  const targetEmail           = paramEmail ?? '';
  const { account }           = useAuth();
  const viewerEmail           = account?.username ?? '';

  // 1️⃣ Presence snapshot + streaming flags
  const { streamingMap, loading: presenceLoading, error } = usePresence();
  const isLiveNow = Boolean(streamingMap[targetEmail]);

  // 2️⃣ Custom hook: subscribe & fetch LiveKit creds
  const {
    accessToken,
    roomName,
    livekitUrl,
    loading: tokenLoading,
  } = useUserStream(viewerEmail, targetEmail);

  // 3️⃣ Update header when title/status change
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
        nameClass="text-white font-bold"
      />
    ),
  }), [targetEmail, isLiveNow]);
  useHeader(headerProps);

  // 4️⃣ Play/Stop/Chat actions
  const { handlePlay, handleStop, handleChat } = useVideoActions();

  if (presenceLoading) return <div className="p-6 text-white">Loading presence…</div>;
  if (error)           return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-20 h-full">
      <div className="flex flex-col flex-1 h-full bg-[var(--color-primary-dark)] p-10">
        {/* Single PSO style wrapper */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-grow items-center justify-center p-4">
            <div className="w-11/12 h-full">
              <VideoCard
                name         ={targetEmail}
                email        ={targetEmail}
                accessToken  ={accessToken}
                roomName     ={roomName}
                livekitUrl   ={livekitUrl}
                shouldStream ={Boolean(accessToken)}
                onToggle     ={() =>
                  accessToken
                    ? handleStop(targetEmail)
                    : handlePlay(targetEmail)
                }
                connecting   ={tokenLoading}
                onPlay       ={handlePlay}
                onStop       ={handleStop}
                onChat       ={handleChat}
                className    ="w-full h-full"
                showHeader   ={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserVideoPage;
