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
 * - Lee el email y fullName del usuario actual.
 * - Muestra el supervisor asignado.
 * - Renderiza el stream de video/audio.
 * - Tiene dos acciones:
 *   • “Show Contact Managers” abre el modal con la tabla.
 *   • <PsoDashboardForm /> ya incluye su propio botón “Actions” y modal.
 */
const PsoDashboard: React.FC = () => {
  const { account } = useAuth();
  const psoEmail   = account?.username ?? '';
  const senderName = account?.name ?? '';

  const { showToast } = useToast();                               // ← added

  const [supervisorName, setSupervisorName] = useState<string | null>(null);
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

  const { videoRef, audioRef, isStreaming } = useStreamingDashboard();
  const {
    managers,
    loading: cmLoading,                                      
    error: cmError
  } = useContactManagerStatus(psoEmail);                     

  // show toast on error
  useEffect(() => {
    if (cmError) {
      showToast('Failed to load Contact Managers', 'error');
    }
  }, [cmError, showToast]);                                    

  const [isCMModalOpen, setCMModalOpen] = useState(false);

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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#764E9F]">
        {supervisorName && (
          <div className="mb-4 text-white text-lg font-semibold">
            Supervisor: {supervisorName}
          </div>
        )}

        <div className="flex flex-col w-full max-w-4xl mb-4 rounded-xl overflow-hidden bg-black h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh]">
          <video
            ref={videoRef}
            autoPlay playsInline muted={false} controls={false}
            className="w-full h-full"
            poster="https://via.placeholder.com/640x360?text=No+Stream"
          />
          <audio ref={audioRef} autoPlay hidden />
          <div className="p-4 text-center text-white bg-[rgba(0,0,0,0.5)]">
            Streaming:{' '}
            <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>
              {isStreaming ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

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

      {/* Modal de Contact Managers */}
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
            loading={cmLoading}                              // ← added
            loadingAction="Loading Contact Managers..."      // ← added
          />
        )}
      </AddModal>
    </>
  );
};

export default PsoDashboard;
