/**
 * @file SupervisorsPage.tsx
 * @description
 * Renders the Supervisors management interface:
 * - **Admins** see:
 *   - “Add Supervisor” button to promote Employees/Tenants to Supervisors  
 *   - Per-row Trash buttons to remove a Supervisor (except themselves)  
 * - **Supervisors** see:
 *   - Per-row “Transfer PSOs” buttons to reassign all of their PSOs to another Supervisor  
 * - **Others** see a read-only list.
 *
 * Uses:
 * - `getUsersByRole` for paged listing  
 * - `changeUserRole` to add/remove Supervisor roles  
 * - `transferPsos` to bulk-reassign a Supervisor’s PSOs  
 * - Toast notifications on success/failure  
 * - `TableComponent` for tabular UI  
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import TransferPSOsButton from '@/components/Buttons/TransferPSOsButton';
import AddModal from '@/components/ModalComponent';
import managementIcon from '@assets/manage_icon_sidebar.png';
import {
  getUsersByRole,
  changeUserRole,
  transferPsos,
} from '../../services/userClient';
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
 * Displays and manages the list of Supervisors.
 *
 * - **Admins** can:
 *   - Add new Supervisors via the “Add Supervisor” modal  
 *   - Remove Supervisors via Trash buttons  
 * - **Supervisors** can:
 *   - Transfer all PSOs under their supervision to another Supervisor  
 * - **Other users** see a read-only list.
 *
 * @returns The Supervisors management UI.
 */
const SupervisorsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const navigate                 = useNavigate();
  const currentEmail             = account?.username ?? '';
  const { showToast }            = useToast();

  // Determine roles of current user
  const claims   = (account?.idTokenClaims ?? {}) as any;
  const rawRoles = claims.roles ?? claims.role;
  const roles: string[] = Array.isArray(rawRoles)
    ? rawRoles
    : typeof rawRoles === 'string'
      ? [rawRoles]
      : [];
  const isAdmin      = roles.includes('Admin');
  const isSupervisor = roles.includes('Supervisor');

  // State for supervisors list
  const [supervisors, setSupervisors]       = useState<CandidateUser[]>([]);
  const [supervisorsLoading, setSupLoading] = useState(false);

  // State for “Add Supervisor” modal
  const [candidates, setCandidates]         = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandLoading] = useState(false);
  const [isModalOpen, setModalOpen]         = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Set page header
  useHeader({
    title:   'Supervisors',
    iconSrc: managementIcon,
    iconAlt: 'Supervisors',
  });

  /** Fetches current Supervisors */
  const fetchSupervisors = async () => {
    setSupLoading(true);
    try {
      const { users } = await getUsersByRole('Supervisor', 1, 1000);
      setSupervisors(users);
    } catch {
      showToast('Failed to load supervisors', 'error');
    } finally {
      setSupLoading(false);
    }
  };

  /** Fetches candidate users for promotion */
  const fetchCandidates = async () => {
    setCandLoading(true);
    try {
      const { users } = await getUsersByRole('Employee,Tenant', 1, 1000);
      setCandidates(users);
    } catch {
      showToast('Failed to load candidate users', 'error');
    } finally {
      setCandLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    if (!initialized) return;
    void fetchSupervisors();
  }, [initialized]);

  /** Opens the “Add Supervisor” modal */
  const handleOpenModal = () => {
    setSelectedEmails([]);
    setModalOpen(true);
    void fetchCandidates();
  };

  /** Confirms adding selected candidates as Supervisors */
  const handleConfirmAdd = async () => {
    setSupLoading(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Supervisor' })
        )
      );
      setModalOpen(false);
      await fetchSupervisors();
      showToast(`${selectedEmails.length} supervisor(s) added`, 'success');
    } catch {
      showToast('Failed to add supervisors', 'error');
    } finally {
      setSupLoading(false);
    }
  };

  /**
   * Removes a Supervisor.
   * Prevents self-removal.
   */
  const handleRemoveSupervisor = async (email: string) => {
    if (email === currentEmail) {
      showToast("You cannot remove yourself", 'warning');
      return;
    }
    setSupLoading(true);
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      await fetchSupervisors();
      showToast(`Removed supervisor: ${email}`, 'success');
    } catch {
      showToast(`Failed to remove supervisor: ${email}`, 'error');
    } finally {
      setSupLoading(false);
    }
  };

  /**
   * Supervisor-only action:
   * Transfers *all* PSOs under the current user to `newSupEmail`.
   */
  const handleTransferPsos = async (newSupEmail: string) => {
    try {
      const moved = await transferPsos(newSupEmail);
      showToast(`Transferred your PSOs to ${newSupEmail}`, 'success');
    } catch {
      showToast('Failed to transfer PSOs', 'error');
    }
  };

  // Base table columns
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

  // Extended columns with per-row action buttons
  const supervisorColumns = useMemo(() => {
    if (isAdmin) {
      // Admin: Trash
      return [
        ...baseSupervisorColumns,
        {
          key:    'actions',
          header: 'Actions',
          render: row => row.email !== currentEmail ? (
            <div className="flex justify-center">
              <TrashButton onClick={() => handleRemoveSupervisor(row.email)} />
            </div>
          ) : null,
        },
      ];
    }

    if (isSupervisor) {
      // Supervisor: Transfer PSOs
      return [
        ...baseSupervisorColumns,
        {
          key:    'actions',
          header: 'Actions',
          render: row => row.email !== currentEmail ? (
            <div className="flex">
              <TransferPSOsButton
                onClick={() => handleTransferPsos(row.email)}
              />
            </div>
          ) : null,
        },
      ];
    }

    // Others: no actions
    return baseSupervisorColumns;
  }, [isAdmin, isSupervisor, currentEmail]);

  // Columns for “Add Supervisor” modal
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
          isAdmin
            ? <AddButton label="Add Supervisor" onClick={handleOpenModal} />
            : null
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
