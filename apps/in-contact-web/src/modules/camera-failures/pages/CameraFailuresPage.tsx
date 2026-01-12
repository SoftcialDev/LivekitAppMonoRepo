/**
 * @fileoverview CameraFailuresPage component
 * @summary Page for viewing camera failure logs
 * @description Displays camera failure logs in a table with details modal
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { getCameraFailures } from '../api/cameraFailuresClient';
import { useHeader } from '@/app/stores/header-store';
import { useAuth } from '@/modules/auth';
import { useToast } from '@/ui-kit/feedback';
import { DataTable } from '@/ui-kit/tables';
import { DetailsModal } from '@/ui-kit/modals';
import { logError } from '@/shared/utils/logger';
import { useTableSelection } from '@/shared/hooks/useTableSelection';
import { createCameraFailureColumns } from './config/cameraFailurePageConfig';
import { FailureDetailsContent } from './components';
import type { CameraFailureReport } from '../types/cameraFailureTypes';

/**
 * CameraFailuresPage component
 * 
 * Displays a table of all camera failure reports with:
 * - Details modal for viewing full failure information
 * - Local pagination and search
 * - Stage color coding
 */
export const CameraFailuresPage: React.FC = () => {
  const { initialized } = useAuth();
  const { showToast } = useToast();

  const [failures, setFailures] = useState<CameraFailureReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<CameraFailureReport | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Set header
  useHeader({
    title: 'Camera Failure Logs',
    iconSrc: managementIcon,
    iconAlt: 'Camera Failure Logs',
  });

  /** Load all failures */
  const fetchFailures = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Fetch all failures - use local pagination
      const response = await getCameraFailures({ limit: 1000, offset: 0 });
      setFailures(response.failures);
    } catch (err) {
      logError(err, { operation: 'fetchFailures' });
      showToast('Failed to load camera failure logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!initialized) return;
    fetchFailures();
  }, [initialized, fetchFailures]);

  /** Handle viewing details */
  const handleViewDetails = useCallback((failure: CameraFailureReport): void => {
    setSelectedFailure(failure);
    setIsDetailsModalOpen(true);
  }, []);

  /** Close details modal */
  const handleCloseDetailsModal = useCallback((): void => {
    setIsDetailsModalOpen(false);
    setSelectedFailure(null);
  }, []);

  // Selection config for checkboxes (for consistency, no actions available)
  const selection = useTableSelection<CameraFailureReport>({
    selectedKeys: selectedIds,
    setSelectedKeys: setSelectedIds,
    getRowKey: (row: CameraFailureReport) => row.id,
  });

  const columns = useMemo(
    () => createCameraFailureColumns({ handleViewDetails }),
    [handleViewDetails]
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-(--color-primary-dark) p-4">
        <div className="flex justify-center max-w-[90%] w-full mx-auto">
          <DataTable<CameraFailureReport>
            columns={columns}
            dataLoader={{
              totalCount: failures.length,
              onFetch: async (limit: number, offset: number) => {
                const paginated = failures.slice(offset, offset + limit);
                return {
                  data: paginated,
                  total: failures.length,
                  count: paginated.length,
                };
              },
              initialFetchSize: 200,
              fetchSize: 200,
            }}
            selection={selection}
            pageSize={10}
            externalLoading={loading}
            externalLoadingAction="Loading camera failure logs..."
            search={{ enabled: true, placeholder: 'Search camera failures...' }}
          />
        </div>
      </div>

      {/* Details Modal */}
      <DetailsModal
        open={isDetailsModalOpen}
        title="Camera Failure Details"
        onClose={handleCloseDetailsModal}
        maxWidth="max-w-4xl"
      >
        {selectedFailure && (
          <FailureDetailsContent failure={selectedFailure} />
        )}
      </DetailsModal>
    </>
  );
};

