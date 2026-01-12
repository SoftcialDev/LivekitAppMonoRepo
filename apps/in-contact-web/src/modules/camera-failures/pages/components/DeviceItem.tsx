/**
 * @fileoverview DeviceItem component
 * @summary Component for displaying a single device in the failure details
 * @description Renders device information in a card format
 */

import React from 'react';
import { DetailField } from '@/ui-kit/details';
import type { IDeviceItemProps } from './types';

/**
 * DeviceItem component - displays a single device's details
 * @param props - Component props
 * @returns React component
 */
export const DeviceItem: React.FC<IDeviceItemProps> = ({ device, index }) => {
  return (
    <div className="bg-(--color-primary) p-4 rounded-lg">
      <h4 className="font-semibold text-gray-300 mb-2">Device {index + 1}</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {device.label && (
          <DetailField label="Label" value={device.label} />
        )}
        {device.deviceId && (
          <DetailField label="Device ID" value={device.deviceId} monospace={true} />
        )}
        {device.deviceIdHash && (
          <DetailField label="Device ID Hash" value={device.deviceIdHash} monospace={true} />
        )}
        {device.groupId && (
          <DetailField label="Group ID" value={device.groupId} monospace={true} />
        )}
        {device.vendorId && (
          <DetailField label="Vendor ID" value={device.vendorId} monospace={true} />
        )}
        {device.productId && (
          <DetailField label="Product ID" value={device.productId} monospace={true} />
        )}
      </div>
    </div>
  );
};

