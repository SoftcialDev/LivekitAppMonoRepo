/**
 * @fileoverview ErrorLogDetailsModal - Modal component for displaying error log details
 * @summary Displays detailed information about an error log using DetailsModal
 * @description Uses the reusable DetailsModal component to display error log details
 * with copy-to-clipboard functionality.
 */

import React from 'react';
import type { IErrorLogDetailsModalProps } from '../../types/errorLogsTypes';
import { DetailsModal } from '@/ui-kit/modals';
import { DetailField } from '@/ui-kit/details';
import { formatDateForDisplay } from '@/shared/utils/time';
import { copyErrorLogToClipboard } from '../../utils/errorLogUtils';

/**
 * ErrorLogDetailsModal component
 * 
 * Displays detailed information about an error log in a modal dialog using
 * the reusable DetailsModal component. Includes copy-to-clipboard functionality.
 * 
 * @param props - Component props
 * @returns JSX element with details modal or null if not open
 */
export const ErrorLogDetailsModal: React.FC<IErrorLogDetailsModalProps> = ({
  errorLog,
  open,
  onClose,
}) => {
  if (!open || !errorLog) {
    return null;
  }

  /**
   * Handles copying error log details to clipboard
   */
  const handleCopyDetails = (): void => {
    void copyErrorLogToClipboard(errorLog);
  };

  /**
   * Header actions (Copy button)
   */
  const headerActions = (
    <button
      onClick={handleCopyDetails}
      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      type="button"
    >
      Copy
    </button>
  );

  return (
    <DetailsModal
      open={open}
      title="Error Log Details"
      onClose={onClose}
      headerActions={headerActions}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            label="ID"
            value={errorLog.id}
            monospace={true}
          />
          <DetailField
            label="Severity"
            value={errorLog.severity}
          />
          <DetailField
            label="Source"
            value={errorLog.source}
          />
          <DetailField
            label="Status Code"
            value={errorLog.httpStatusCode || 'N/A'}
          />
          <DetailField
            label="Resolved"
            value={
              <span className={errorLog.resolved ? 'text-green-500' : 'text-red-500'}>
                {errorLog.resolved ? 'Yes' : 'No'}
              </span>
            }
          />
          <DetailField
            label="Created"
            value={formatDateForDisplay(errorLog.createdAt)}
          />
        </div>

        {/* Error Information */}
        <DetailField
          label="Error Name"
          value={errorLog.errorName}
          valueClassName="font-semibold"
        />

        <DetailField
          label="Error Message"
          value={errorLog.errorMessage}
          valueClassName="whitespace-pre-wrap break-words"
        />

        {/* Context Information */}
        {(errorLog.endpoint || errorLog.functionName || errorLog.userEmail) && (
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-white font-semibold mb-2">Context</h3>
            <div className="grid grid-cols-2 gap-4">
              {errorLog.endpoint && (
                <DetailField
                  label="Endpoint"
                  value={errorLog.endpoint}
                  monospace={true}
                />
              )}
              {errorLog.functionName && (
                <DetailField
                  label="Function"
                  value={errorLog.functionName}
                  monospace={true}
                />
              )}
              {errorLog.userEmail && (
                <DetailField
                  label="User Email"
                  value={errorLog.userEmail}
                />
              )}
              {errorLog.userId && (
                <DetailField
                  label="User ID"
                  value={errorLog.userId}
                  monospace={true}
                />
              )}
              {errorLog.requestId && (
                <DetailField
                  label="Request ID"
                  value={errorLog.requestId}
                  monospace={true}
                />
              )}
            </div>
          </div>
        )}

        {/* Stack Trace */}
        {errorLog.stackTrace && (
          <div className="border-t border-gray-600 pt-4">
            <div className="text-gray-400 text-sm mb-2 block">Stack Trace</div>
            <pre className="bg-gray-900 p-4 rounded text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
              {errorLog.stackTrace}
            </pre>
          </div>
        )}

        {/* Context Data */}
        {errorLog.context && Object.keys(errorLog.context).length > 0 && (
          <div className="border-t border-gray-600 pt-4">
            <div className="text-gray-400 text-sm mb-2 block">Additional Context</div>
            <pre className="bg-gray-900 p-4 rounded text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(errorLog.context, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </DetailsModal>
  );
};
