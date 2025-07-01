// src/features/video/pages/SupervisorsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import AddModal from '@/components/ModalComponent';
import managementIcon from '@assets/monitor-icon.png';
import { getUsersByRole, changeUserRole } from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            'Admin' | 'Supervisor' | 'Employee' | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

const SupervisorsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const navigate = useNavigate();
  const currentEmail = account?.username ?? '';

  const claims = (account?.idTokenClaims ?? {}) as Record<string, any>;
  const rolesClaim = claims.roles ?? claims.role;
  const roles: string[] = Array.isArray(rolesClaim)
    ? rolesClaim
    : typeof rolesClaim === 'string'
    ? [rolesClaim]
    : [];
  const isAdmin = roles.includes('Admin');

  const [supervisors, setSupervisors] = useState<CandidateUser[]>([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(false);

  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title:   'Supervisors',
    iconSrc: managementIcon,
    iconAlt: 'Supervisors',
  });

  const fetchSupervisors = async () => {
    setSupervisorsLoading(true);
    try {
      const res = await getUsersByRole('Supervisor', 1, 1000);
      setSupervisors(res.users);
    } catch (err) {
      console.error('Failed to load supervisors:', err);
    } finally {
      setSupervisorsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await getUsersByRole('Employee,Tenant', 1, 1000);
      setCandidates(res.users);
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchSupervisors();
  }, [initialized]);

  const handleOpenModal = () => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  const handleConfirmAdd = async () => {
    setSupervisorsLoading(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Supervisor' })
        )
      );
      setModalOpen(false);
      await fetchSupervisors();
    } catch (err) {
      console.error('Error adding supervisors:', err);
    } finally {
      setSupervisorsLoading(false);
    }
  };

  const handleRemoveSupervisor = async (email: string) => {
    if (email === currentEmail) {
      console.warn("Supervisors cannot remove themselves.");
      return;
    }
    setSupervisorsLoading(true);
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      await fetchSupervisors();
    } catch (err) {
      console.error('Error removing supervisor:', err);
    } finally {
      setSupervisorsLoading(false);
    }
  };

  const baseSupervisorColumns: Column<CandidateUser>[] = [
    { key: 'email', header: 'Email' },
    {
      key: 'firstName',
      header: 'First Name',
      render: row => (
        <span
          className="cursor-pointer text-[var(--color-secondary)] hover:underline"
          onClick={() => navigate(`/supervisors/${row.azureAdObjectId}`)}
        >
          {row.firstName}
        </span>
      ),
    },
    { key: 'lastName', header: 'Last Name' },
    { key: 'role', header: 'Role' },
  ];

  const supervisorColumns = useMemo(() => {
    if (isAdmin) {
      return [
        ...baseSupervisorColumns,
        {
          key: 'actions',
          header: 'Actions',
          render: row =>
            row.email !== currentEmail ? (
              <TrashButton onClick={() => handleRemoveSupervisor(row.email)} />
            ) : null,
        },
      ];
    }
    return baseSupervisorColumns;
  }, [isAdmin, currentEmail]);

  const candidateColumns: Column<CandidateUser>[] = [
    {
      key: 'select',
      header: 'Select',
      render: row => (
        <input
          type="checkbox"
          checked={selectedEmails.includes(row.email)}
          onChange={e =>
            setSelectedEmails(prev =>
              e.target.checked
                ? [...prev, row.email]
                : prev.filter(x => x !== row.email)
            )
          }
          className="
            appearance-none w-5 h-5 rounded border-2
            border-[var(--color-primary)] bg-[var(--color-primary-light)]
            checked:bg-[var(--color-secondary)]
            checked:border-[var(--color-secondary)]
            focus:ring-0 focus:outline-none cursor-pointer
            transition-colors
          "
        />
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'role', header: 'Role' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<CandidateUser>
        columns={supervisorColumns}
        data={supervisors}
        pageSize={9}
        addButton={
          isAdmin ? (
            <AddButton label="Add Supervisor" onClick={handleOpenModal} />
          ) : null
        }
        loading={supervisorsLoading}
        loadingAction="Loading supervisors"
      />

      {isAdmin && (
        <AddModal
          open={isModalOpen}
          title="Add Supervisor"
          iconSrc={managementIcon}
          iconAlt="Supervisors"
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirmAdd}
          confirmLabel="Add Supervisor"
        >
          <TableComponent<CandidateUser>
            columns={candidateColumns}
            data={candidates}
            pageSize={5}
            addButton={null}
            headerBg="bg-[var(--color-primary)]"
            tablePadding="p-13"
            loading={candidatesLoading}
            loadingAction="Loading candidates"
          />
        </AddModal>
      )}
    </div>
  );
};

export default SupervisorsPage;
