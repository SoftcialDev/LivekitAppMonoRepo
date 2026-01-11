/**
 * @fileoverview Snapshots module barrel export
 * @summary Exports snapshots module components, pages, and types
 */

export { SnapshotReportPage } from './pages/SnapshotReportPage';
export type { SnapshotReport, SnapshotReason, GetSnapshotsResponse } from './types/snapshotTypes';
export { getSnapshots, deleteSnapshot } from './api/snapshotsClient';
export { snapshotRoutes } from './routes';

