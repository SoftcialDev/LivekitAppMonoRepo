/**
 * @fileoverview Camera Failure page column configuration
 * @summary Column definitions for camera failure report table
 * @description Defines column configurations for the camera failure report DataTable
 */

import React from 'react';
import type { Column } from '@/ui-kit/tables';
import { getStageColorClass, formatCameraFailureDate } from '../../utils/cameraFailureUtils';
import { CAMERA_FAILURE_CELL_CLASSES } from '../constants/cameraFailurePageConstants';
import type { CameraFailureReport } from '../../types/cameraFailureTypes';
import type { ICameraFailureColumnHandlers } from '../types/cameraFailurePageTypes';

/**
 * Creates column definitions for camera failure report table
 * 
 * @param handlers - Handlers required for column actions (view details)
 * @returns Array of column definitions for camera failure report table
 */
export function createCameraFailureColumns(
  handlers: ICameraFailureColumnHandlers
): Column<CameraFailureReport>[] {
  const { handleViewDetails } = handlers;

  return [
    {
      key: 'stage',
      header: 'Stage',
      render: (row) => (
        <span className={getStageColorClass(row.stage)}>
          {row.stage}
        </span>
      ),
      cellClassName: CAMERA_FAILURE_CELL_CLASSES.STAGE,
    },
    {
      key: 'userEmail',
      header: 'User Email',
      render: (row) => row.userEmail || 'N/A',
      cellClassName: CAMERA_FAILURE_CELL_CLASSES.USER_EMAIL,
    },
    {
      key: 'userAdId',
      header: 'User AD ID',
      cellClassName: CAMERA_FAILURE_CELL_CLASSES.USER_AD_ID,
    },
    {
      key: 'errorName',
      header: 'Error Name',
      render: (row) => row.errorName || 'N/A',
      cellClassName: CAMERA_FAILURE_CELL_CLASSES.ERROR_NAME,
    },
    {
      key: 'errorMessage',
      header: 'Error Message',
      render: (row) => (
        <div 
          className={CAMERA_FAILURE_CELL_CLASSES.ERROR_MESSAGE}
          title={row.errorMessage || ''}
        >
          {row.errorMessage || 'N/A'}
        </div>
      ),
    },
    {
      key: 'deviceCount',
      header: 'Device Count',
      render: (row) => row.deviceCount ?? 'N/A',
      cellClassName: CAMERA_FAILURE_CELL_CLASSES.DEVICE_COUNT,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatCameraFailureDate(row.createdAt),
      cellClassName: CAMERA_FAILURE_CELL_CLASSES.CREATED_AT,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const hasDetails = 
          (row.devicesSnapshot && Array.isArray(row.devicesSnapshot) && row.devicesSnapshot.length > 0) ||
          (row.attempts && Array.isArray(row.attempts) && row.attempts.length > 0) ||
          (row.metadata && typeof row.metadata === 'object' && Object.keys(row.metadata).length > 0);
        
        if (!hasDetails) {
          return <span className="text-gray-500 text-sm">No details</span>;
        }
        
        return (
          <button
            onClick={() => handleViewDetails(row)}
            className="px-2 py-1 text-sm bg-(--color-primary) text-white rounded hover:bg-(--color-primary-light) transition-colors"
          >
            View
          </button>
        );
      },
    },
  ];
}

