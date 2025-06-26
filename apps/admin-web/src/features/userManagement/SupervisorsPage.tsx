import React, { useEffect, useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import AddModal from '@/components/ModalComponent';
import managementIcon from '@assets/monitor-icon.png';
import { getUsersByRole, changeUserRole } from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a user in Admin/Supervisor pages.
 *
 * Matches the API’s UserByRole shape:
 * - `role` is "Admin" | "Supervisor" | "Employee" | null.
 */
interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            'Admin' | 'Supervisor' | 'Employee' | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * SupervisorsPage
 *
 * - Displays current Supervisors (role="Supervisor") in a table.
 * - “Add Supervisor” opens a modal listing candidate users (Employee and Tenant).
 * - Prevents self-removal.
 *
 * Uses getUsersByRole which returns PagedResponse<UserByRole>, so we extract `.users`.
 */
const SupervisorsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const currentEmail = account?.username ?? '';

  const [supervisors, setSupervisors] = useState<CandidateUser[]>([]);
  const [candidates, setCandidates]   = useState<CandidateUser[]>([]);
  const [isModalOpen, setModalOpen]   = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title:   'Supervisors',
    iconSrc: managementIcon,
    iconAlt: 'Supervisors',
  });

  /**
   * Load current Supervisors from API.
   *
   * Calls GET /api/GetUsersByRole?role=Supervisor&page=1&pageSize=1000
   * Extracts `res.users: UserByRole[]` and sets state.
   */
  const fetchSupervisors = async (): Promise<void> => {
    try {
      const res = await getUsersByRole('Supervisor', 1, 1000);
      setSupervisors(res.users);
    } catch (err: any) {
      console.error('Failed to load supervisors:', err);
    }
  };

  /**
   * Load candidate users: all Employees and Tenant users (no Supervisor).
   *
   * Calls GET /api/GetUsersByRole?role=Employee,Tenant&page=1&pageSize=1000
   * Extracts `res.users`.
   */
  const fetchCandidates = async (): Promise<void> => {
    try {
      const res = await getUsersByRole('Employee,Tenant', 1, 1000);
      setCandidates(res.users);
    } catch (err: any) {
      console.error('Failed to load candidates:', err);
    }
  };

  useEffect(() => {
    if (!initialized || !account) return;
    fetchSupervisors();
  }, [initialized, account]);

  /** Open the modal, reset selection, and fetch candidates */
  const handleOpenModal = (): void => {
    setModalOpen(true);
    setSelectedEmails([]);
    fetchCandidates();
  };

  /** Assign "Supervisor" role to selected users */
  const handleConfirmAdd = async (): Promise<void> => {
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Supervisor' })
        )
      );
      setModalOpen(false);
      fetchSupervisors();
    } catch (err: any) {
      console.error('Error adding supervisors:', err);
    }
  };

  /**
   * Remove Supervisor role from a user; prevents self-removal.
   */
  const handleRemoveSupervisor = async (email: string): Promise<void> => {
    if (email === currentEmail) {
      console.warn("Supervisors cannot remove themselves.");
      return;
    }
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      fetchSupervisors();
    } catch (err: any) {
      console.error('Error removing supervisor:', err);
    }
  };

  //
  // Column definitions
  //
  const supervisorColumns: Column<CandidateUser>[] = [
    { key: 'email',     header: 'Email'      },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName',  header: 'Last Name'  },
    { key: 'role',      header: 'Role'       },
    {
      key: 'email',
      header: 'Actions',
      render: row =>
        row.email === currentEmail ? null : (
          <TrashButton onClick={() => handleRemoveSupervisor(row.email)} />
        ),
    },
  ];

  const candidateColumns: Column<CandidateUser>[] = [
    {
      key: 'azureAdObjectId',
      header: 'Select',
      render: row => (
        <input
          type="checkbox"
          checked={selectedEmails.includes(row.email)}
          onChange={e => {
            setSelectedEmails(prev =>
              e.target.checked
                ? [...prev, row.email]
                : prev.filter(x => x !== row.email)
            );
          }}
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
    { key: 'email',     header: 'Email'      },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName',  header: 'Last Name'  },
    { key: 'role',      header: 'Role'       },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<CandidateUser>
        columns={supervisorColumns}
        data={supervisors}
        pageSize={9}
        addButton={<AddButton label="Add Supervisor" onClick={handleOpenModal} />}
      />

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
        />
      </AddModal>
    </div>
  );
};

export default SupervisorsPage;
