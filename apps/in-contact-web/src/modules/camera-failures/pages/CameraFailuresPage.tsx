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
import { DetailField } from '@/ui-kit/details';
import { logError } from '@/shared/utils/logger';
import { createCameraFailureColumns } from './config/cameraFailurePageConfig';
import { getStageColorClass, formatCameraFailureDate } from '../utils/cameraFailureUtils';
import type { CameraFailureReport } from '../types/cameraFailureTypes';
import type { NormalizedDevice, NormalizedAttempt } from '../types/cameraFailureTypes';

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
  const selection = useMemo(
    () => ({
      selectedKeys: selectedIds,
      onToggleRow: (key: string, checked: boolean) => {
        setSelectedIds((prev) =>
          checked
            ? Array.from(new Set([...prev, key]))
            : prev.filter((k) => k !== key)
        );
      },
      onToggleAll: (checked: boolean, keys: string[]) => {
        setSelectedIds((prev) =>
          checked
            ? Array.from(new Set([...prev, ...keys]))
            : prev.filter((k) => !keys.includes(k))
        );
      },
      getRowKey: (row: CameraFailureReport) => row.id,
    }),
    [selectedIds]
  );

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
          <div className="space-y-4 text-sm">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label="ID"
                value={selectedFailure.id}
                monospace={true}
              />
              <DetailField
                label="User Email"
                value={selectedFailure.userEmail || 'N/A'}
              />
              <DetailField
                label="User AD ID"
                value={selectedFailure.userAdId}
                monospace={true}
              />
              <DetailField
                label="Stage"
                value={
                  <span className={getStageColorClass(selectedFailure.stage)}>
                    {selectedFailure.stage}
                  </span>
                }
              />
              <DetailField
                label="Error Name"
                value={selectedFailure.errorName || 'N/A'}
              />
              <DetailField
                label="Device Count"
                value={selectedFailure.deviceCount ?? 'N/A'}
              />
              <DetailField
                label="Created"
                value={formatCameraFailureDate(selectedFailure.createdAt)}
              />
              {selectedFailure.createdAtCentralAmerica && (
                <DetailField
                  label="Created (Central America)"
                  value={selectedFailure.createdAtCentralAmerica}
                />
              )}
            </div>

            {/* Error Message */}
            <DetailField
              label="Error Message"
              value={selectedFailure.errorMessage || 'N/A'}
              valueClassName="whitespace-pre-wrap wrap-break-word"
            />

            {/* Devices Snapshot */}
            {selectedFailure.devicesSnapshot &&
              Array.isArray(selectedFailure.devicesSnapshot) &&
              selectedFailure.devicesSnapshot.length > 0 && (
                <div className="mt-6 border-t border-gray-600 pt-4">
                  <h3 className="text-white font-semibold mb-3 text-lg">
                    Devices Snapshot ({selectedFailure.devicesSnapshot.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedFailure.devicesSnapshot.map((device: NormalizedDevice, index: number) => (
                      <div key={index} className="bg-(--color-primary) p-4 rounded-lg">
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
                    ))}
                  </div>
                </div>
              )}

            {/* Attempts */}
            {selectedFailure.attempts &&
              Array.isArray(selectedFailure.attempts) &&
              selectedFailure.attempts.length > 0 && (
                <div className="mt-6 border-t border-gray-600 pt-4">
                  <h3 className="text-white font-semibold mb-3 text-lg">
                    Attempts ({selectedFailure.attempts.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedFailure.attempts.map((attempt: NormalizedAttempt, index: number) => (
                      <div key={index} className="bg-(--color-primary) p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-300 mb-2">Attempt {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {attempt.label && (
                            <DetailField label="Label" value={attempt.label} />
                          )}
                          {attempt.deviceId && (
                            <DetailField label="Device ID" value={attempt.deviceId} monospace={true} />
                          )}
                          {attempt.deviceIdHash && (
                            <DetailField label="Device ID Hash" value={attempt.deviceIdHash} monospace={true} />
                          )}
                          {attempt.result && (
                            <DetailField label="Result" value={attempt.result} />
                          )}
                          {attempt.errorName && (
                            <DetailField label="Error Name" value={attempt.errorName} />
                          )}
                          {attempt.errorMessage && (
                            <div className="col-span-2">
                              <DetailField
                                label="Error Message"
                                value={attempt.errorMessage}
                                valueClassName="whitespace-pre-wrap wrap-break-word"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Metadata */}
            {selectedFailure.metadata &&
              typeof selectedFailure.metadata === 'object' &&
              Object.keys(selectedFailure.metadata).length > 0 && (
                <div className="mt-6 border-t border-gray-600 pt-4">
                  <h3 className="text-white font-semibold mb-3 text-lg">Metadata</h3>
                  <div className="bg-(--color-primary) p-4 rounded-lg">
                    <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap wrap-break-word">
                      {JSON.stringify(selectedFailure.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
          </div>
        )}
      </DetailsModal>
    </>
  );
};

