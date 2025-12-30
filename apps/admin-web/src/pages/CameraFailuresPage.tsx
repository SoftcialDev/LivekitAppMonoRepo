/**
 * @fileoverview CameraFailuresPage - Page for viewing camera failure logs
 * @description Displays camera failure logs in a table with filtering and pagination
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/shared/auth/useAuth';
import { useHeader } from '@/app/providers/HeaderContext';
import { useToast } from '@/shared/ui/ToastContext';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import AddModal from '@/shared/ui/ModalComponent';
import {
  getCameraFailures,
  CameraFailure,
  CameraFailureQueryParams,
} from '@/shared/api/cameraFailuresClient';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { parseIsoAsCRWallClock } from '@/shared/utils/time';

/**
 * CameraFailuresPage component
 * Displays camera failure logs in a table
 */
const CameraFailuresPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const { showToast } = useToast();
  const currentEmail = account?.username ?? '';

  const [failures, setFailures] = useState<CameraFailure[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [filters, setFilters] = useState<CameraFailureQueryParams>({
    limit: 100,
    offset: 0,
  });
  const [selectedFailure, setSelectedFailure] = useState<CameraFailure | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useHeader({
    title: 'Camera Failure Logs',
    iconSrc: managementIcon,
    iconAlt: 'Camera Failure Logs',
  });

  /**
   * Fetches camera failure logs from the API
   */
  const fetchCameraFailures = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await getCameraFailures(filters);
      setFailures(response.failures);
      setTotal(response.total || response.count);
      setHasMore(response.hasMore || false);
      
      if (response.total !== undefined) {
        console.log('[CameraFailuresPage] Pagination info:', {
          returned: response.count,
          total: response.total,
          limit: response.limit,
          offset: response.offset,
          hasMore: response.hasMore
        });
      }
    } catch (err: any) {
      console.error('Failed to load camera failure logs:', err);
      showToast('Failed to load camera failure logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  /**
   * Handles viewing details of a single camera failure
   * Uses data already loaded in the table, no additional API call needed
   */
  const handleViewDetails = (id: string): void => {
    const failure = failures.find(f => f.id === id);
    if (!failure) {
      showToast('Camera failure not found in current page', 'error');
      return;
    }
    setSelectedFailure(failure);
    setIsDetailsModalOpen(true);
  };

  /**
   * Closes the details modal
   */
  const handleCloseDetailsModal = (): void => {
    setIsDetailsModalOpen(false);
    setSelectedFailure(null);
  };

  // Fetch camera failures on mount and when filters change
  useEffect(() => {
    if (!initialized || !account) return;
    fetchCameraFailures();
  }, [initialized, account, filters]);

  /**
   * Formats date for display in Central America Time
   */
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    return parseIsoAsCRWallClock(dateStr).format('YYYY-MM-DD HH:mm:ss');
  };

  /**
   * Gets stage color class
   */
  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'Permission':
        return 'text-red-500';
      case 'Enumerate':
        return 'text-orange-500';
      case 'TrackCreate':
        return 'text-yellow-500';
      case 'LiveKitConnect':
        return 'text-blue-500';
      case 'Publish':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  /**
   * Table columns definition
   */
  const columns: Column<CameraFailure>[] = [
    {
      key: 'stage',
      header: 'Stage',
      render: (row) => (
        <span className={getStageColor(row.stage)}>
          {row.stage}
        </span>
      ),
    },
    {
      key: 'userEmail',
      header: 'User Email',
      render: (row) => row.userEmail || 'N/A',
    },
    {
      key: 'userAdId',
      header: 'User AD ID',
    },
    {
      key: 'errorName',
      header: 'Error Name',
      render: (row) => row.errorName || 'N/A',
    },
    {
      key: 'errorMessage',
      header: 'Error Message',
      cellClassName: 'whitespace-normal',
      render: (row) => (
        <div 
          className="break-words max-w-md" 
          title={row.errorMessage || ''}
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.4',
            minWidth: '200px'
          }}
        >
          {row.errorMessage || 'N/A'}
        </div>
      ),
    },
    {
      key: 'deviceCount',
      header: 'Device Count',
      render: (row) => row.deviceCount ?? 'N/A',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => {
        const hasDetails = (row.devicesSnapshot && Array.isArray(row.devicesSnapshot) && row.devicesSnapshot.length > 0) ||
                          (row.attempts && Array.isArray(row.attempts) && row.attempts.length > 0) ||
                          (row.metadata && typeof row.metadata === 'object' && Object.keys(row.metadata).length > 0);
        
        if (!hasDetails) {
          return <span className="text-gray-500 text-sm">No details</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewDetails(row.id)}
              className="px-2 py-1 text-sm bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-light)] transition-colors"
            >
              View
            </button>
          </div>
        );
      },
    },
  ];

  /**
   * Handles loading more camera failures (next page)
   */
  const handleLoadMore = (): void => {
    const currentOffset = filters.offset || 0;
    const limit = filters.limit || 100;
    const nextOffset = currentOffset + limit;
    
    if (nextOffset >= total) return;
    
    setFilters(prev => ({
      ...prev,
      offset: nextOffset
    }));
  };

  /**
   * Handles going to previous page
   */
  const handleLoadPrevious = (): void => {
    const currentOffset = filters.offset || 0;
    const limit = filters.limit || 100;
    if (currentOffset === 0) return;
    
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, currentOffset - limit)
    }));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      {/* Pagination info and controls */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-300">
        <div>
          Showing {failures.length} of {total} camera failures
          {filters.offset !== undefined && filters.limit !== undefined && (
            <span className="ml-2">
              (Page {Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadPrevious}
            disabled={!filters.offset || filters.offset === 0}
            className="px-3 py-1 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleLoadMore}
            disabled={(filters.offset || 0) + failures.length >= total}
            className="px-3 py-1 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      <TableComponent<CameraFailure & { azureAdObjectId?: string }>
        columns={columns}
        data={failures.map(failure => ({ ...failure, azureAdObjectId: failure.id }))}
        pageSize={Math.max(failures.length, 100)}
        loading={loading}
        loadingAction="Loading camera failure logs"
        showRowCheckboxes={false}
        getRowKey={(row) => row.id}
        addButton={null}
      />

      <AddModal
        open={isDetailsModalOpen}
        title="Camera Failure Details"
        iconSrc={managementIcon}
        iconAlt="Camera Failure Details"
        onClose={handleCloseDetailsModal}
        onConfirm={handleCloseDetailsModal}
        confirmLabel="Close"
        hideFooter={false}
        className="max-w-4xl"
      >
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {selectedFailure && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-300">ID:</span>
                  <p className="text-white break-all">{selectedFailure.id}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300">User Email:</span>
                  <p className="text-white">{selectedFailure.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300">User AD ID:</span>
                  <p className="text-white break-all">{selectedFailure.userAdId}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300">Stage:</span>
                  <p className={`text-white ${getStageColor(selectedFailure.stage)}`}>
                    {selectedFailure.stage}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300">Error Name:</span>
                  <p className="text-white">{selectedFailure.errorName || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-300">Device Count:</span>
                  <p className="text-white">{selectedFailure.deviceCount ?? 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-300">Error Message:</span>
                  <p className="text-white break-words whitespace-pre-wrap">
                    {selectedFailure.errorMessage || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-300">Created (Central America):</span>
                  <p className="text-white">
                    {selectedFailure.createdAtCentralAmerica || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedFailure.devicesSnapshot && 
               Array.isArray(selectedFailure.devicesSnapshot) && 
               selectedFailure.devicesSnapshot.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg text-gray-300 mb-3">
                    Devices Snapshot ({selectedFailure.devicesSnapshot.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedFailure.devicesSnapshot.map((device: any, index: number) => (
                      <div key={index} className="bg-[var(--color-primary)] p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-300 mb-2">Device {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {device.label && (
                            <div>
                              <span className="text-gray-400">Label:</span>
                              <p className="text-white break-all">{device.label}</p>
                            </div>
                          )}
                          {device.deviceId && (
                            <div>
                              <span className="text-gray-400">Device ID:</span>
                              <p className="text-white break-all">{device.deviceId}</p>
                            </div>
                          )}
                          {device.groupId && (
                            <div>
                              <span className="text-gray-400">Group ID:</span>
                              <p className="text-white break-all font-mono text-xs">{device.groupId}</p>
                            </div>
                          )}
                          {device.vendorId && (
                            <div>
                              <span className="text-gray-400">Vendor ID:</span>
                              <p className="text-white break-all">{device.vendorId}</p>
                            </div>
                          )}
                          {device.productId && (
                            <div>
                              <span className="text-gray-400">Product ID:</span>
                              <p className="text-white break-all">{device.productId}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFailure.attempts && 
               Array.isArray(selectedFailure.attempts) && 
               selectedFailure.attempts.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg text-gray-300 mb-3">
                    Attempts ({selectedFailure.attempts.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedFailure.attempts.map((attempt: any, index: number) => (
                      <div key={index} className="bg-[var(--color-primary)] p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-300 mb-2">Attempt {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {attempt.label && (
                            <div>
                              <span className="text-gray-400">Label:</span>
                              <p className="text-white break-all">{attempt.label}</p>
                            </div>
                          )}
                          {attempt.deviceId && (
                            <div>
                              <span className="text-gray-400">Device ID:</span>
                              <p className="text-white break-all">{attempt.deviceId}</p>
                            </div>
                          )}
                          {attempt.result && (
                            <div>
                              <span className="text-gray-400">Result:</span>
                              <p className="text-white">{attempt.result}</p>
                            </div>
                          )}
                          {attempt.errorName && (
                            <div>
                              <span className="text-gray-400">Error Name:</span>
                              <p className="text-white">{attempt.errorName}</p>
                            </div>
                          )}
                          {attempt.errorMessage && (
                            <div className="col-span-2">
                              <span className="text-gray-400">Error Message:</span>
                              <p className="text-white break-words whitespace-pre-wrap">
                                {attempt.errorMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFailure.metadata && 
               typeof selectedFailure.metadata === 'object' && 
               Object.keys(selectedFailure.metadata).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg text-gray-300 mb-3">Metadata</h3>
                  <div className="bg-[var(--color-primary)] p-4 rounded-lg">
                    <pre className="text-white text-xs overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedFailure.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AddModal>
    </div>
  );
};

export default CameraFailuresPage;

