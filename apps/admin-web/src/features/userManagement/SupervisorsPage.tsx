/**
 * @file SupervisorsPage.tsx
 * @description
 * The SupervisorsPage component displays a list of current Supervisors
 * and, for Admin users, allows adding or removing Supervisors.
 * It uses real-time data from the backend and shows Toast notifications
 * on success or failure.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import AddModal from '@/components/ModalComponent';
import managementIcon from '@assets/manage_icon_sidebar.png';
import { getUsersByRole, changeUserRole } from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';
import { useToast } from '../../components/ToastContext';

export interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            'Admin' | 'Supervisor' | 'Employee' | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

/**
 * SupervisorsPage
 *
 * Renders a table of supervisors for Admins and non-editable list for others.
 * Admins can add new Supervisors by selecting from Employee/Tenant candidates,
 * or remove existing Supervisors via the trash button.
 *
 * @returns A React.FC that displays the supervisors management UI.
 */
const SupervisorsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const navigate = useNavigate();
  const currentEmail = account?.username ?? '';
  const { showToast } = useToast();

  // Determine if the current user has Admin role
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

  /**
   * Fetch the list of current Supervisors from the API.
   * Shows a loading spinner and displays a toast on failure.
   */
  const fetchSupervisors = async (): Promise<void> => {
    setSupervisorsLoading(true);
    try {
      const res = await getUsersByRole('Supervisor', 1, 1000);
      setSupervisors(res.users);
    } catch (err: any) {
      showToast('Failed to load supervisors', 'error');
    } finally {
      setSupervisorsLoading(false);
    }
  };

  /**
   * Fetch the list of candidate users (Employees & pure Tenants)
   * who can be promoted to Supervisors.
   * Shows a loading spinner and displays a toast on failure.
   */
  const fetchCandidates = async (): Promise<void> => {
    setCandidatesLoading(true);
    try {
      const res = await getUsersByRole('Employee,Tenant', 1, 1000);
      setCandidates(res.users);
    } catch (err: any) {
      showToast('Failed to load candidate users', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchSupervisors();
  }, [initialized]);

  /**
   * Opens the Add Supervisor modal
   * and resets selection state.
   */
  const handleOpenModal = (): void => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  /**
   * Confirms the addition of selected users
   * as Supervisors. Shows a toast on success or failure.
   */
  const handleConfirmAdd = async (): Promise<void> => {
    setSupervisorsLoading(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Supervisor' })
        )
      );
      setModalOpen(false);
      await fetchSupervisors();
      showToast(`${selectedEmails.length} supervisor(s) added`, 'success');
    } catch (err: any) {
      showToast('Failed to add supervisors', 'error');
    } finally {
      setSupervisorsLoading(false);
    }
  };

  /**
   * Removes a Supervisor by email.
   * Prevents self-removal. Shows a toast on success or failure.
   *
   * @param email - The email of the Supervisor to remove.
   */
  const handleRemoveSupervisor = async (email: string): Promise<void> => {
    if (email === currentEmail) {
      showToast("You cannot remove yourself", 'warning');
      return;
    }
    setSupervisorsLoading(true);
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      await fetchSupervisors();
      showToast(`Removed supervisor: ${email}`, 'success');
    } catch (err: any) {
      showToast(`Failed to remove supervisor: ${email}`, 'error');
    } finally {
      setSupervisorsLoading(false);
    }
  };

  // Define columns for the supervisors table
  const baseSupervisorColumns: Column<CandidateUser>[] = [
    { key: 'email',      header: 'Email'      },
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
    { key: 'lastName',   header: 'Last Name'  },
    { key: 'role',       header: 'Role'       },
  ];

  // Conditionally add the Actions column for Admins
  const supervisorColumns = useMemo<Column<CandidateUser>[]>(
    () => isAdmin
      ? [
          ...baseSupervisorColumns,
          {
            key:    'actions',
            header: 'Actions',
            render: row =>
              row.email !== currentEmail ? (
                <TrashButton onClick={() => handleRemoveSupervisor(row.email)} />
              ) : null,
          },
        ]
      : baseSupervisorColumns,
    [isAdmin, currentEmail]
  );

  // Define columns for the Add Supervisor modal
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
    { key: 'email',      header: 'Email'      },
    { key: 'firstName',  header: 'First Name' },
    { key: 'lastName',   header: 'Last Name'  },
    { key: 'role',       header: 'Role'       },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<CandidateUser>
        columns={supervisorColumns}
        data={supervisors}
        pageSize={9}
        addButton={
          isAdmin ? <AddButton label="Add Supervisor" onClick={handleOpenModal} /> : null
        }
        loading={supervisorsLoading}
        loadingAction="Loading supervisors"
      />

      {isAdmin && (
        <AddModal
          open={isModalOpen}
          title="Add Supervisor"
          iconSrc={managementIcon}
          iconAlt="Add Supervisor"
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
