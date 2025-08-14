import React, { useEffect, useState } from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { useHeader } from '@/app/providers/HeaderContext';
import { getUsersByRole, changeUserRole } from '@/shared/api/userClient';
import { useAuth } from '@/shared/auth/useAuth';
import AddButton from '@/shared/ui/Buttons/AddButton';
import TrashButton from '@/shared/ui/Buttons/TrashButton';
import AddModal from '@/shared/ui/ModalComponent';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import { useToast } from '@/shared/ui/ToastContext';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a user for PSO management.
 *
 * - `role === "Employee"` for current PSOs.
 * - `role === null` for tenant-user candidates.
 */
export interface CandidateUser {
  azureAdObjectId: string;
  email:           string;
  firstName:       string;
  lastName:        string;
  role:            'Employee' | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * PSOsListPage
 *
 * Strategy: fetch-all + client-side pagination.
 * - Fetch up to API_PAGE_SIZE users once and cache in memory.
 * - Render with a small UI_PAGE_SIZE so the table paginates locally.
 * - After mutations (add/remove), refetch to stay fresh.
 */
const PSOsListPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const currentEmail = account?.username ?? '';
  const { showToast } = useToast();

  /** Max items fetched from API (bring-all). */
  const API_PAGE_SIZE = 1000;
  /** Rows per page in the table UI (local pagination). */
  const UI_PAGE_SIZE = 8;

  // State for PSO list page
  const [psos, setPsos]               = useState<CandidateUser[]>([]);
  const [psosLoading, setPsosLoading] = useState(false);

  // State for candidate modal
  const [candidates, setCandidates]               = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [isModalOpen, setModalOpen]               = useState(false);
  const [selectedEmails, setSelectedEmails]       = useState<string[]>([]);

  useHeader({
    title:   'PSOs',
    iconSrc: managementIcon,
    iconAlt: 'PSOs',
  });

  /**
   * Fetch all PSOs (role=Employee) in one call (fetch-all).
   * The UI will paginate in-memory via TableComponent.
   */
  const fetchPsos = async (): Promise<void> => {
    setPsosLoading(true);
    try {
      const res = await getUsersByRole('Employee', 1, API_PAGE_SIZE);
      const mapped: CandidateUser[] = res.users.map(u => ({
        azureAdObjectId: u.azureAdObjectId,
        email:           u.email,
        firstName:       u.firstName,
        lastName:        u.lastName,
        role:            'Employee',
        supervisorAdId:  u.supervisorAdId,
        supervisorName:  u.supervisorName,
      }));
      setPsos(mapped);
    } catch (err: any) {
      console.error('Failed to load PSOs:', err);
      showToast('Failed to load PSOs', 'error');
    } finally {
      setPsosLoading(false);
    }
  };

  /**
   * Fetch tenant-user candidates for the add-modal (fetch-all as well).
   */
  const fetchCandidates = async (): Promise<void> => {
    setCandidatesLoading(true);
    try {
      const res = await getUsersByRole('Tenant', 1, API_PAGE_SIZE);
      const mapped: CandidateUser[] = res.users.map(u => ({
        azureAdObjectId: u.azureAdObjectId,
        email:           u.email,
        firstName:       u.firstName,
        lastName:        u.lastName,
        role:            null,
      }));
      setCandidates(mapped);
    } catch (err: any) {
      console.error('Failed to load candidates:', err);
      showToast('Failed to load candidates', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // On mount (when auth ready), load list
  useEffect(() => {
    if (!initialized || !account) return;
    fetchPsos();
  }, [initialized, account]);

  /** Open modal and load candidates. */
  const handleOpenModal = (): void => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  /**
   * Assign "Employee" role to selected users and refresh the list.
   */
  const handleConfirmAdd = async (): Promise<void> => {
    setPsosLoading(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Employee' })
        )
      );
      setModalOpen(false);
      await fetchPsos();
      showToast(
        `${selectedEmails.length} user${selectedEmails.length > 1 ? 's' : ''} added`,
        'success'
      );
    } catch (err: any) {
      console.error('Error adding PSOs:', err);
      showToast('Failed to add PSOs', 'error');
    } finally {
      setPsosLoading(false);
    }
  };

  /**
   * Remove "Employee" role from a PSO and refresh.
   */
  const handleRemovePso = async (email: string): Promise<void> => {
    if (email === currentEmail) {
      showToast("You can't remove yourself", 'warning');
      return;
    }
    setPsosLoading(true);
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      await fetchPsos();
      showToast(`Removed ${email}`, 'success');
    } catch (err: any) {
      console.error('Error removing PSO:', err);
      showToast(`Failed to remove ${email}`, 'error');
    } finally {
      setPsosLoading(false);
    }
  };

  // Columns for main PSO table
  const psoColumns: Column<CandidateUser>[] = [
    { key: 'email',          header: 'Email'      },
    { key: 'firstName',      header: 'First Name' },
    { key: 'lastName',       header: 'Last Name'  },
    { key: 'supervisorName', header: 'Supervisor' },
    { key: 'role',           header: 'Role'       },
    {
      key: 'email',
      header: 'Actions',
      render: row =>
        row.email === currentEmail ? null : (
          <TrashButton onClick={() => handleRemovePso(row.email)} />
        ),
    },
  ];

  // Columns for Add PSO modal
  const candidateColumns: Column<CandidateUser>[] = [
    {
      key: 'azureAdObjectId',
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
    { key: 'email',     header: 'Email'      },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName',  header: 'Last Name'  },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      {/* Main PSO table (client-side pagination with small UI page size) */}
      <TableComponent<CandidateUser>
        columns={psoColumns}
        data={psos}
        pageSize={UI_PAGE_SIZE}
        addButton={<AddButton label="Add PSO" onClick={handleOpenModal} />}
        loading={psosLoading}
        loadingAction="Loading PSOs"
      />

      {/* Modal for selecting new PSOs */}
      <AddModal
        open={isModalOpen}
        title="Add PSOs"
        iconSrc={managementIcon}
        iconAlt="PSOs"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Add Selected"
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
    </div>
  );
};

export default PSOsListPage;
