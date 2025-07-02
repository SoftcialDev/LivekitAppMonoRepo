import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import AddModal from '@/components/ModalComponent';
import managementIcon from '@assets/manage_icon_sidebar.png';
import {
  getUsersByRole,
  changeSupervisor as changeSupervisorRole,
} from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';
import { useToast } from '../../components/ToastContext';

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

  // Load only PSOs for this supervisor
  const loadPSOs = useCallback(async () => {
    const emp = await getUsersByRole('Employee', 1, 1000);
    setCandidatesLoading(true); 
    setPsos(
      emp.users
        .filter(u => u.supervisorAdId === supervisorAdId)
        .map(u => ({
          azureAdObjectId: u.azureAdObjectId,
          email:           u.email,
          firstName:       u.firstName,
          lastName:        u.lastName,
          supervisorName, // display name of current supervisor
        }))
    );
  }, [supervisorAdId, supervisorName]);

  // Modal: list ALL employees + tenants, excluding those already assigned
const loadCandidates = useCallback(async () => {
  try {
    // 1) Fetch employees
    const empResp = await getUsersByRole('Employee', 1, 1000);
    console.log('EMPLOYEE FETCH:', empResp.users);

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

    // 3) Fetch tenants and drop any with a non-null role
    const tenResp = await getUsersByRole('Tenant', 1, 1000);
    console.log('TENANT FETCH:', tenResp.users);

    const availableTenants = tenResp.users
      .filter(u => u.role === null)    // only pure tenants
      .map(u => ({
        azureAdObjectId: u.azureAdObjectId,
        email:           u.email,
        firstName:       u.firstName,
        lastName:        u.lastName,
        supervisorName:  '—',
      }));

    // 4) Combine both and set state
    setCandidates([
      ...availableEmployees,
      ...availableTenants,
    ]);

    console.log('FINAL CANDIDATES:', [
      ...availableEmployees,
      ...availableTenants,
    ]);
    setCandidates([...availableEmployees, ...availableTenants]);
  } catch (err) {
    console.error('loadCandidates error', err);
  }finally {
   setCandidatesLoading(false); 
  }
}, [supervisorAdId]);


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
