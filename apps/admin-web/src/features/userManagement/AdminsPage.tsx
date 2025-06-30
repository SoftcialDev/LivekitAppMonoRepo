import React, { useEffect, useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import AddModal from '@/components/ModalComponent';
import managementIcon from '@assets/monitor-icon.png';
import { getUsersByRole, changeUserRole } from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';
import { useToast } from '../../components/ToastContext'

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a user in AdminsPage context.
 *
 * Matches the API’s UserByRole shape.
 */
interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  /**
   * Current App Role or null for tenant users.
   * One of "Admin" | "Supervisor" | "Employee" | null
   */
  role: 'Admin' | 'Supervisor' | 'Employee' | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * AdminsPage
 *
 * - Displays current Admins (role="Admin") in a table.
 * - “Add Admin” modal shows candidates: Supervisor, Employee, Tenant users.
 * - Prevents self-removal.
 */
const AdminsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const currentEmail = account?.username ?? '';

  const { showToast } = useToast()
  const [admins, setAdmins] = useState<CandidateUser[]>([]);
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title:   'Admins',
    iconSrc: managementIcon,
    iconAlt: 'Admins',
  });

  /**
   * Load current Admins from API with paging=1,pageSize large enough.
   * Calls GET /api/GetUsersByRole?role=Admin&page=1&pageSize=...
   * Extracts `.users` before setState.
   */
  const fetchAdmins = async (): Promise<void> => {
    try {
      const res = await getUsersByRole('Admin', 1, 1000)
      setAdmins(res.users)
    } catch (err: any) {
      console.error('Failed to load admins:', err)
      showToast('Could not load admins', 'error')            // ← on error
    }
  }

  /**
   * Load candidate users: everyone except Admins.
   * Uses roleParam "Supervisor,Employee,Tenant".
   */
  const fetchCandidates = async (): Promise<void> => {
    try {
      const res = await getUsersByRole('Supervisor,Employee,Tenant', 1, 1000);
      setCandidates(res.users);
    } catch (err: any) {
      showToast('Could not load candidate users', 'error')    // ← on error
      console.error('Failed to load candidates:', err);
    }
  };

  useEffect(() => {
    if (!initialized || !account) return;
    fetchAdmins();
  }, [initialized, account]);

  /** Open “Add Admin” modal and reset selection + fetch candidates */
  const handleOpenModal = (): void => {
    setModalOpen(true);
    setSelectedEmails([]);
    fetchCandidates();
  };

  /** Assign "Admin" role to selected emails */
  const handleConfirmAdd = async (): Promise<void> => {
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Admin' })
        )
      );
      setModalOpen(false);
      fetchAdmins();
      showToast(
        `${selectedEmails.length} admin${selectedEmails.length > 1 ? 's' : ''} added`,
        'success'
      )   
    } catch (err: any) {
      showToast('Failed to add admins', 'error')              // ← on error
      console.error('Error adding admins:', err);
    }
  };

  /**
   * Remove Admin role from a single user.
   * No-op if the user attempts to remove themselves.
   */
  const handleRemoveAdmin = async (email: string): Promise<void> => {
    if (email === currentEmail) {
       showToast("You can't remove yourself", 'warning')   
      console.warn("Admins cannot remove themselves.");
      return;
    }
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      fetchAdmins();
      showToast(`Removed ${email} from admins`, 'success')   
    } catch (err: any) {
       showToast(`Failed to remove ${email}`, 'error')  
      console.error('Error removing admin:', err);
    }
  };

  //
  // Column definitions
  //
  const adminColumns: Column<CandidateUser>[] = [
    { key: 'email',     header: 'Email'      },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName',  header: 'Last Name'  },
    { key: 'role',      header: 'Role'       },
    {
      key: 'email',
      header: 'Actions',
      render: row =>
        row.email === currentEmail ? null : (
          <TrashButton onClick={() => handleRemoveAdmin(row.email)} />
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
        columns={adminColumns}
        data={admins}
        pageSize={9}
        addButton={<AddButton label="Add Admin" onClick={handleOpenModal} />}
      />

      <AddModal
        open={isModalOpen}
        title="Add Admin"
        iconSrc={managementIcon}
        iconAlt="Admins"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Add Admin"
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



export default AdminsPage;
