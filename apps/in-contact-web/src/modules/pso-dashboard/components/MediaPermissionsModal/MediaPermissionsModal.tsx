/**
 * @fileoverview MediaPermissionsModal - Modal for displaying camera/microphone permission errors
 * @summary Modal that shows device information when media permissions are blocked
 * @description Displays a modal with available cameras and microphones when permissions are denied,
 * providing clear instructions on how to enable permissions.
 */

import React from 'react';
import { BaseModal } from '@/ui-kit/modals';
import { ModalHeader, ModalBody } from '@/ui-kit/modals/components';
import { IMediaPermissionsModalProps } from './types/mediaPermissionsModalTypes';

/**
 * Modal component for displaying media permission errors with device information
 */
export const MediaPermissionsModal: React.FC<IMediaPermissionsModalProps> = ({
  open,
  onClose,
  cameras,
  microphones,
  cameraBlocked,
  microphoneBlocked,
}) => {
  const hasBlockedPermissions = cameraBlocked || microphoneBlocked;
  const hasCameras = cameras.length > 0;
  const hasMicrophones = microphones.length > 0;

  const getTitle = (): string => {
    if (cameraBlocked && microphoneBlocked) {
      return 'Camera and Microphone Permissions Blocked';
    }
    if (cameraBlocked) {
      return 'Camera Permissions Blocked';
    }
    if (microphoneBlocked) {
      return 'Microphone Permissions Blocked';
    }
    return 'Media Permissions Blocked';
  };

  const getMessage = (): string => {
    if (cameraBlocked && microphoneBlocked) {
      return 'Access to camera and microphone is blocked. Please enable permissions for this site in your browser settings and refresh the page.';
    }
    if (cameraBlocked) {
      return 'Access to camera is blocked. Please enable camera permissions for this site in your browser settings and refresh the page.';
    }
    if (microphoneBlocked) {
      return 'Access to microphone is blocked. Please enable microphone permissions for this site in your browser settings and refresh the page.';
    }
    return 'Access to media is blocked. Please enable permissions for this site in your browser settings and refresh the page.';
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className="w-full max-w-2xl"
      draggable={false}
      customHeader={
        <ModalHeader
          title={getTitle()}
          onClose={onClose}
          draggable={false}
        />
      }
      customFooter={
        <div className="flex justify-end px-6 py-4 border-t border-(--color-secondary)">
          <button
            onClick={onClose}
          className="px-4 py-2 bg-(--color-primary) text-white rounded hover:opacity-80 transition-opacity"
        >
          Close
        </button>
        </div>
      }
    >
      <ModalBody padding="px-6 py-4" scrollable={true}>
        <div className="space-y-4">
          <p className="text-white text-base">{getMessage()}</p>

          {hasBlockedPermissions && (
            <div className="space-y-4">
              {cameraBlocked && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Detected Cameras:</h3>
                  {hasCameras ? (
                    <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
                      {cameras.map((camera, index) => (
                        <li key={camera.deviceId || index}>
                          {camera.label || `Camera ${index + 1} (ID: ${camera.deviceId.substring(0, 8)}...)`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/60 text-sm italic">
                      No cameras could be detected. You may not have permissions to enumerate devices or no cameras are connected.
                    </p>
                  )}
                </div>
              )}

              {microphoneBlocked && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Detected Microphones:</h3>
                  {hasMicrophones ? (
                    <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
                      {microphones.map((mic, index) => (
                        <li key={mic.deviceId || index}>
                          {mic.label || `Microphone ${index + 1} (ID: ${mic.deviceId.substring(0, 8)}...)`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/60 text-sm italic">
                      No microphones could be detected. You may not have permissions to enumerate devices or no microphones are connected.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>
    </BaseModal>
  );
};

