import React from 'react';
import { useStreamingDashboard } from './useCamara';


const PsoDashboard: React.FC = () => {
  const { videoRef, audioRef, isStreaming } = useStreamingDashboard();

  return (
    <div className="flex items-center justify-center h-screen p-4 bg-[#764E9F]">
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
          Streaming: <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>
            {isStreaming ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PsoDashboard;
