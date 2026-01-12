/**
 * @fileoverview DevicesSection component
 * @summary Component for displaying devices snapshot section
 * @description Renders the devices snapshot section in failure details
 */

import React from 'react';
import { DeviceItem } from './DeviceItem';
import type { IDevicesSectionProps } from './types';

/**
 * DevicesSection component - displays devices snapshot section
 * @param props - Component props
 * @returns React component or null if no devices
 */
export const DevicesSection: React.FC<IDevicesSectionProps> = ({ devices }) => {
  if (!devices || !Array.isArray(devices) || devices.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-600 pt-4">
      <h3 className="text-white font-semibold mb-3 text-lg">
        Devices Snapshot ({devices.length})
      </h3>
      <div className="space-y-4">
        {devices.map((device, index) => {
          const key = device.deviceIdHash || device.deviceId || device.label || `device-${index}`;
          return <DeviceItem key={key} device={device} index={index} />;
        })}
      </div>
    </div>
  );
};

