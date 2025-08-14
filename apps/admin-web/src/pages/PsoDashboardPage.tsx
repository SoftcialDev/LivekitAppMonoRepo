import React, { useEffect, useState } from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import AddModal from '@/shared/ui/ModalComponent';
import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/ui/ToastContext';
import { getSupervisorForPso } from '@/shared/api/userClient';
import { ContactManagerProfile } from '@/shared/api/contactManagerClient';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import { useContactManagerStatus } from './ContactManager/hooks/useContactManagerStatus';
import { PsoDashboardForm } from './PSO/components/PSODashboardForm';
import { useStreamingDashboard } from './Video/hooks/useCamara';

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * PsoDashboard
 *
 * Renders a personal dashboard for a PSO (Public Safety Officer) user.
 * It displays the current user's supervisor (if available), embeds a live
 * video/audio stream, and provides two actions: opening the Contact Managers
 * modal and using the PSO actions form.
 *
 * Data sources:
 * - `useAuth()` provides `username` and `name` used as PSO identity.
 * - `getSupervisorForPso(email)` fetches the assigned supervisor.
 * - `useContactManagerStatus(email)` retrieves Contact Managers with status.
 * - `useStreamingDashboard()` supplies media refs and streaming state.
 *
 * UI:
 * - Main video container with an overlay showing streaming ON/OFF.
 * - Button to open the Contact Managers table inside a modal.
 * - `<PsoDashboardForm />` which includes its own “Actions” button and modal.
 *
 * Errors:
 * - Contact Manager load errors are surfaced via a toast notification.
 *
 * @returns The PSO dashboard screen with streaming preview and management tools.
 */


const PsoDashboard: React.FC = () => {
  const { account } = useAuth();

  /**
   * PSO identity derived from the authenticated account.
   * - `psoEmail` is used for data fetches.
   * - `senderName` is passed to forms or messages that need a display name.
   */
  const psoEmail   = account?.username ?? '';
  const senderName = account?.name ?? '';

  const { showToast } = useToast();                           

  /** Supervisor full name to display in the banner; `null` until loaded. */
  const [supervisorName, setSupervisorName] = useState<string | null>(null);

  /**
   * Fetch the supervisor assigned to the current PSO.
   * Skips fetching when `psoEmail` is empty.
   */
  useEffect(() => {
    if (!psoEmail) return;
    getSupervisorForPso(psoEmail)
      .then(res => {
        if ('supervisor' in res) {
          setSupervisorName(res.supervisor.fullName);
        }
      })
      .catch(err => console.warn('Failed to fetch supervisor:', err));
  }, [psoEmail]);

  /**
   * Media streaming hooks:
   * - `videoRef` attaches to the <video> element.
   * - `audioRef` attaches to the <audio> element.
   * - `isStreaming` toggles the status indicator.
   */
  const { videoRef, audioRef, isStreaming } = useStreamingDashboard();

  /**
   * Contact Manager data feed for the given PSO.
   * - `managers`: array of ContactManagerProfile records.
   * - `cmLoading`: loading state for table and modal.
   * - `cmError`: error object/string used to trigger toast and fallback UI.
   */
  const {
    managers,
    loading: cmLoading,                                      
    error: cmError
  } = useContactManagerStatus(psoEmail);                     

  /**
   * When Contact Manager loading fails, show a toast message once per error.
   */
  useEffect(() => {
    if (cmError) {
      showToast('Failed to load Contact Managers', 'error');
    }
  }, [cmError, showToast]);                                    

  /** Controls whether the Contact Managers modal is open. */
  const [isCMModalOpen, setCMModalOpen] = useState(false);

  /**
   * Table column configuration for Contact Managers listing.
   * Includes a custom renderer for `updatedAt` to show a localized timestamp.
   */
  const columns: Column<ContactManagerProfile>[] = [
    { key: 'fullName', header: 'Name' },
    { key: 'email',    header: 'Email' },
    { key: 'status',   header: 'Status' },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: row => new Date(row.updatedAt).toLocaleString(),
    },
  ];

  return (
    <>
      {/* Main wrapper with centered layout and purple background */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#764E9F]">
        {/* Supervisor banner (only shown when available) */}
        {supervisorName && (
          <div className="mb-4 text-white text-lg font-semibold">
            Supervisor: {supervisorName}
          </div>
        )}

        {/* Streaming viewport: responsive height, black background */}
        <div className="flex flex-col w-full max-w-4xl mb-4 rounded-xl overflow-hidden bg-black h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]">
          <video
            ref={videoRef}
            autoPlay playsInline muted={false} controls={false}
            className="w-full h-full"
            poster="https://via.placeholder.com/640x360?text=No+Stream"
          />
          <audio ref={audioRef} autoPlay hidden />
          {/* Status overlay */}
          <div className="p-4 text-center text-white bg-[rgba(0,0,0,0.5)]">
            Streaming:{' '}
            <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>
              {isStreaming ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Primary actions: open managers modal and render PSO form actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => setCMModalOpen(true)}
            className="px-4 py-2 bg-[var(--color-secondary)] text-[var(--color-primary-dark)] font-semibold rounded-full hover:bg-[var(--color-secondary-hover)] transition-colors"
          >
            Show Contact Managers
          </button>

          {/* Aquí metemos el componente que ya trae su propio botón “Actions” */}
          <PsoDashboardForm
            psoEmail={psoEmail}
            senderName={senderName}
          />
        </div>
      </div>

      {/* Contact Managers modal with table and loading/error states */}
      <AddModal
        open={isCMModalOpen}
        title="Contact Managers"
        iconSrc={managementIcon}
        iconAlt="Contact Managers"
        onClose={() => setCMModalOpen(false)}
        onConfirm={() => setCMModalOpen(false)}
        confirmLabel="Close"
        loading={cmLoading}                                   
        loadingAction="Loading Contact Managers..."   
        className='w-fit'        
      >
        {cmError ? (
          <div className="text-red-500">Failed to load Contact Managers.</div>
        ) : managers.length === 0 && !cmLoading ? (
          <div>No Contact Managers found.</div>
        ) : (
          <TableComponent
            columns={columns}
            data={managers.map(m => ({ ...m, azureAdObjectId: undefined }))}
            pageSize={5}
            addButton={null}
            loading={cmLoading}                              
            loadingAction="Loading Contact Managers..."     
          />
        )}
      </AddModal>
    </>
  );
};

export default PsoDashboard;
