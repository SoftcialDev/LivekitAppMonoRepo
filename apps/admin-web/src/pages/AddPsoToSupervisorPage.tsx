import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import {
  getUsersByRole,
  changeSupervisor as changeSupervisorRole,
  getPsosBySupervisorId,
} from '@/shared/api/userClient';
import { useToast } from '@/shared/ui/ToastContext';
import { useAuth } from '@/shared/auth/useAuth';
import { useHeader } from '@/app/providers/HeaderContext';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import AddButton from '@/shared/ui/Buttons/AddButton';
import AddModal from '@/shared/ui/ModalComponent';
import TrashButton from '@/shared/ui/Buttons/TrashButton';


interface PSO {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  supervisorName?: string;
}

const SupervisorDetailPage: React.FC = () => {
  const { id: supervisorAdId } = useParams<{ id: string }>();
  const { initialized }        = useAuth();
  const { showToast }          = useToast();

  const [supervisorEmail, setSupervisorEmail] = useState<string>('');
  const [supervisorName,  setSupervisorName]  = useState<string>('…');
  const [psos,            setPsos]            = useState<PSO[]>([]);
  const [candidates,      setCandidates]      = useState<PSO[]>([]);
  const [modalOpen,       setModalOpen]       = useState(false);
  const [selected,        setSelected]        = useState<string[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [psosLoading, setPsosLoading] = useState(false);

  // 1) Lookup supervisor’s email & name
  useEffect(() => {
    if (!initialized) return;
    (async () => {
      const resp = await getUsersByRole('Supervisor', 1, 1000);
      const sup  = resp.users.find(u => u.azureAdObjectId === supervisorAdId);
      if (sup) {
        setSupervisorEmail(sup.email);
        setSupervisorName(`${sup.firstName} ${sup.lastName}`);
      }
    })();
  }, [initialized, supervisorAdId]);

  useHeader({
    title:   `Supervisors / ${supervisorName}`,
    iconSrc: managementIcon,
    iconAlt: 'Supervisor',
  });

  // Load only PSOs for this supervisor using the specific API
  const loadPSOs = useCallback(async () => {
    if (!supervisorAdId) return;
    
    try {
      setPsosLoading(true);
      const psosData = await getPsosBySupervisorId(supervisorAdId);
      
      // Convert to the expected format
      const psosList = psosData.map(pso => ({
        azureAdObjectId: '', // Not available in this API response
        email: pso.email,
        firstName: pso.email.split('@')[0], // Extract from email as fallback
        lastName: '',
        supervisorName: pso.supervisorName,
      }));
      
      setPsos(psosList);
    } catch (error) {
      console.error('Failed to load PSOs for supervisor:', error);
      showToast('Failed to load PSOs for this supervisor', 'error');
    } finally {
      setPsosLoading(false);
    }
  }, [supervisorAdId, showToast]);

  // Modal: list ALL employees, excluding those already assigned
const loadCandidates = useCallback(async () => {
  try {
    setCandidatesLoading(true);
    
    // 1) Fetch employees
    const empResp = await getUsersByRole('Employee', 1, 1000);

    // 2) Keep only employees NOT already assigned to this supervisor
    const availableEmployees = empResp.users
      .filter(u =>
        u.role === 'Employee' &&              // just to be safe
        u.supervisorAdId !== supervisorAdId   // not yet under this sup
      )
      .map(u => ({
        azureAdObjectId: u.azureAdObjectId,
        email:           u.email,
        firstName:       u.firstName,
        lastName:        u.lastName,
        supervisorName:  u.supervisorName ?? '—',
      }));

    // 3) Set only employees as candidates
    setCandidates(availableEmployees);
  } catch (err) {
    console.error('loadCandidates error', err);
    showToast('Failed to load candidate employees', 'error');
  } finally {
    setCandidatesLoading(false); 
  }
}, [supervisorAdId, showToast]);


  useEffect(() => {
    if (!initialized) return;
    loadPSOs();
  }, [initialized, loadPSOs]);

  const handleAdd = async () => {
    if (!supervisorEmail) return;
    try {
      const count = await changeSupervisorRole({
        userEmails: selected,
        newSupervisorEmail: supervisorEmail,
      });
      showToast(
        `Assigned ${count} user${count > 1 ? 's' : ''} to ${supervisorName}.`,
        'success'
      );
      setModalOpen(false);
      setSelected([]);
      await loadPSOs();
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || 'Failed to assign users.',
        'error'
      );
    }
  };

  const handleRemove = async (email: string) => {
    try {
      const count = await changeSupervisorRole({
        userEmails: [email],
        newSupervisorEmail: null,
      });
      showToast(
        `Removed supervisor from ${email}.`,
        'success'
      );
      await loadPSOs();
    } catch (err: any) {
      console.error(err);
      showToast(
        err.message || `Failed to remove supervisor from ${email}.`,
        'error'
      );
    }
  };

  // Columns for the main PSO table
  const psoColumns: Column<PSO>[] = [
    { key: 'email',          header: 'Email'      },
    { key: 'firstName',      header: 'First Name' },
    { key: 'lastName',       header: 'Last Name'  },
    { key: 'supervisorName', header: 'Supervisor' },
    {
      key: 'email',
      header: 'Actions',
      render: row => <TrashButton onClick={() => handleRemove(row.email)} />,
    },
  ];

  // Columns for the Add PSO modal
  const candidateColumns: Column<PSO>[] = [
    {
      key: 'azureAdObjectId',
      header: 'Select',
      render: row => (
        <input
          type="checkbox"
          checked={selected.includes(row.email)}
          onChange={e =>
            setSelected(prev =>
              e.target.checked
                ? [...prev, row.email]
                : prev.filter(x => x !== row.email)
            )
          }
          className="appearance-none w-5 h-5 rounded border-2 border-[var(--color-primary)] bg-[var(--color-primary-light)] checked:bg-[var(--color-secondary)] checked:border-[var(--color-secondary)] focus:ring-0 focus:outline-none cursor-pointer transition-colors"
        />
      ),
    },
    { key: 'email',          header: 'Email'      },
    { key: 'firstName',      header: 'First Name' },
    { key: 'lastName',       header: 'Last Name'  },
    { key: 'supervisorName', header: 'Supervisor' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<PSO>
        columns={psoColumns}
        data={psos}
        pageSize={9}
        loading={psosLoading}
        loadingAction="Loading PSOs for this supervisor"
        addButton={
          <AddButton
            label="Add PSO"
            onClick={() => {
              setSelected([]);
              loadCandidates();
              setModalOpen(true);
            }}
          />
        }
      />

      <AddModal
        open={modalOpen}
        title="Add PSO"
        iconSrc={managementIcon}
        iconAlt="Add PSO"
        onClose={() => setModalOpen(false)}
        onConfirm={handleAdd}
        confirmLabel="Add Selected"
      >
        <TableComponent<PSO>
          columns={candidateColumns}
          data={candidates}
          pageSize={5}
          addButton={null}
          loading={candidatesLoading }
          loadingAction="Loading candidates"
          headerBg="bg-[var(--color-primary)]"
          tablePadding="p-13"
        />
      </AddModal>
    </div>
  );
};

export default SupervisorDetailPage;
