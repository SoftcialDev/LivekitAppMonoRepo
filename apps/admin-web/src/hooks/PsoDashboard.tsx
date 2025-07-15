import React, { useEffect, useState } from 'react';
import { useStreamingDashboard } from './useCamara';
import { useAuth } from '../features/auth/hooks/useAuth';
import { getSupervisorForPso } from '@/services/userClient';

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * PsoDashboard
 *
 * - Reads the current viewer’s email from `useAuth`.
 * - Fetches and displays the viewer’s assigned supervisor (if any).
 * - Uses `useStreamingDashboard` to render the PSO’s video/audio stream.
 *
 * @returns A React element rendering the PSO dashboard with supervisor info.
 */
const PsoDashboard: React.FC = () => {
  const { account } = useAuth();
  const psoEmail = account?.username ?? '';

  const [supervisorName, setSupervisorName] = useState<string | null>(null);

  const { videoRef, audioRef, isStreaming } = useStreamingDashboard();

  // On mount, look up this PSO’s supervisor
  useEffect(() => {
    if (!psoEmail) return;

    getSupervisorForPso(psoEmail)
      .then(res => {
        if ('supervisor' in res) {
          setSupervisorName(res.supervisor.fullName);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch supervisor:', err);
      });
  }, [psoEmail]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-[#764E9F]">
      {/* Supervisor header */}
      {supervisorName && (
        <div className="mb-4 text-white text-lg font-semibold">
          Supervisor: {supervisorName}
        </div>
      )}

      <div className="flex flex-col h-full w-full max-w-4xl rounded-xl overflow-hidden bg-black">
        <div className="flex-1 min-h-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            controls={false}
            className="w-full h-full object-cover"
            poster="https://via.placeholder.com/640x360?text=No+Stream"
          />
          <audio ref={audioRef} autoPlay hidden />
        </div>
        <div className="p-4 text-center text-white bg-[rgba(0,0,0,0.5)]">
          Streaming: {' '}
          <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>
            {isStreaming ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PsoDashboard;
