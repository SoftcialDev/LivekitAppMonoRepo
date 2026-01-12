/**
 * @fileoverview VideoCardControls - Control buttons component for VideoCard
 * @summary Displays all control buttons for video card actions
 * @description Component that renders all control buttons including play/stop,
 * chat, talk, snapshot, and recording buttons with proper permission checks.
 */

import React from 'react';
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
  const playButtonContent = recordingLoading || talkLoading ? '...' : playLabel;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <div className="flex-1 relative">
        {shouldStream ? (
          <StopReasonButton
            onSelect={onStopReasonSelect}
            disabled={playButtonDisabled}
            className="w-full"
          >
            {playButtonContent}
          </StopReasonButton>
        ) : (
          <button
            onClick={() => onToggle?.(email)}
            disabled={playButtonDisabled}
            className="w-full py-2 bg-white text-(--color-primary-dark) rounded-xl disabled:opacity-50"
            title="Start stream"
          >
            {playButtonContent}
          </button>
        )}
      </div>

      <button
        onClick={() => onChat(email)}
        className="flex-1 py-2 bg-(--color-secondary) text-(--color-primary-dark) rounded-xl"
      >
        Chat
      </button>

      {canTalkControl && (
        <button
          onClick={onTalkClick}
          disabled={talkDisabled && !isCountdownActive}
          className="flex-1 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
          title={isCountdownActive ? 'Cancel talk session' : 'Publish your microphone to this user'}
        >
          {talkLoading ? '...' : talkLabel}
        </button>
      )}

      {canSnapshot && (
        <button
          onClick={onSnapshotClick}
          disabled={snapshotDisabled}
          className="flex-1 py-2 bg-yellow-400 rounded-xl disabled:opacity-50"
          title={snapshotDisabled ? 'Snapshot is available only while streaming' : undefined}
        >
          Snapshot
        </button>
      )}

      {canRecord && (
        <button
          onClick={onRecordClick}
          disabled={recordDisabled}
          className={`flex-1 py-2 rounded-xl ${isRecording ? 'bg-red-500 text-white' : 'bg-[#BBA6CF] text-white'} disabled:opacity-50`}
          title={recordDisabled ? 'Recording is available only while streaming' : undefined}
        >
          {(() => {
            if (recordingLoading) return '...';
            return isRecording ? 'Stop Rec' : 'Start Rec';
          })()}
        </button>
      )}
    </div>
  );
};

