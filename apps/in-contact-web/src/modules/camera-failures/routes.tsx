/**
 * @fileoverview Camera Failures routes configuration
 * @summary Defines routes for camera failures module
 * @description Exports route definitions for camera failures pages
 */

import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { EmailProtectedRoute } from '@/ui-kit/navigation';
import { CameraFailuresPage } from './pages';

/**
 * Camera failures module routes
 * 
 * These routes are protected by email pattern restriction (only for specific admin users).
 * They should be composed within a layout (e.g., DashboardLayout) in AppRouter.
 * 
 * @returns Array of route objects for camera failures pages
 */
export function cameraFailuresRoutes(): RouteObject[] {
  return [
    {
      path: '/cameraFailures',
      element: (
        <EmailProtectedRoute emailPattern="shanty.cerdas">
          <CameraFailuresPage />
        </EmailProtectedRoute>
      ),
    },
  ];
}

