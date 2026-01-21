/**
 * @fileoverview VideoCardControls - Control buttons component for VideoCard
 * @summary Displays all control buttons for video card actions
 * @description Component that renders all control buttons including play/stop,
 * chat, talk, snapshot, and recording buttons with proper permission checks.
 */

import React from 'react';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Camera, 
  Play, 
  Square, 
  Circle,
  Loader2
} from 'lucide-react';
import StopReasonButton from '@/ui-kit/buttons/StopReasonButton';
import type { IVideoCardControlsProps } from '../types/videoCardComponentTypes';

/**
 * VideoCardControls component
 * 
 * Renders all control buttons for the video card:
 * - Play/Stop button (with stop reason dropdown when streaming)
 * - Chat button
 * - Talk button (permission gated)
 * - Snapshot button (permission gated)
 * - Recording button (permission gated)
 * 
 * @param props - Component props
 * @returns React element rendering the controls section
 */
export const VideoCardControls: React.FC<IVideoCardControlsProps> = ({
  shouldStream,
  connecting,
  disableControls,
  recordingLoading,
  talkLoading,
  playLabel,
  onToggle,
  email,
  onStopReasonSelect,
  onChat,
  canTalkControl,
  isCountdownActive,
  isTalking,
  countdown,
  talkLabel,
  talkDisabled,
  onTalkClick,
  canSnapshot,
  snapshotDisabled,
  onSnapshotClick,
  canRecord,
  recordDisabled,
  isRecording,
  onRecordClick,
}) => {
  const isPlayDisabled = disableControls || connecting;
  const playButtonDisabled = isPlayDisabled || recordingLoading || talkLoading;
  const isPlayLoading = recordingLoading || talkLoading || connecting;

  return (
    <div className="flex gap-2 mt-2">
      <div className="flex-1 relative">
        {shouldStream ? (
          <StopReasonButton
            onSelect={onStopReasonSelect}
            disabled={playButtonDisabled}
            className="w-full"
            hideDropdownIcon={true}
          >
            <div className="flex items-center justify-center">
              {isPlayLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </div>
          </StopReasonButton>
        ) : (
          <button
            onClick={() => onToggle?.(email)}
            disabled={playButtonDisabled}
            className="w-full py-2 px-3 bg-white text-(--color-primary-dark) rounded-xl disabled:opacity-50 flex items-center justify-center"
            title="Start stream"
          >
            {isPlayLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <button
        onClick={() => onChat(email)}
        className="flex-1 py-2 px-3 bg-(--color-secondary) text-(--color-primary-dark) rounded-xl flex items-center justify-center"
        title="Open chat"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {canTalkControl && (
        <button
          onClick={onTalkClick}
          disabled={talkDisabled && !isCountdownActive}
          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 flex items-center justify-center"
          title={isCountdownActive ? 'Cancel talk session' : isTalking ? 'Stop microphone' : 'Start microphone'}
        >
          {talkLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isTalking ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>
      )}

      {canSnapshot && (
        <button
          onClick={onSnapshotClick}
          disabled={snapshotDisabled}
          className="flex-1 py-2 px-3 bg-yellow-400 rounded-xl disabled:opacity-50 flex items-center justify-center"
          title={snapshotDisabled ? 'Snapshot is available only while streaming' : 'Take snapshot'}
        >
          <Camera className="w-5 h-5 text-black" />
        </button>
      )}

      {canRecord && (
        <button
          onClick={onRecordClick}
          disabled={recordDisabled}
          className={`flex-1 py-2 px-3 rounded-xl ${isRecording ? 'bg-red-500 text-white' : 'bg-[#BBA6CF] text-white'} disabled:opacity-50 flex items-center justify-center`}
          title={recordDisabled ? 'Recording is available only while streaming' : isRecording ? 'Stop recording' : 'Start recording'}
        >
          {recordingLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5 fill-current" />
          )}
        </button>
      )}
    </div>
  );
};

