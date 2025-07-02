import React, { useEffect, useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '@components/TableComponent';
import AddButton from '@components/Buttons/AddButton';
import TrashButton from '@/components/Buttons/TrashButton';
import AddModal from '@components/ModalComponent';
import managementIcon from '@assets/manage_icon_sidebar.png';
import { getUsersByRole, changeUserRole } from '../../services/userClient';
import { useAuth } from '../auth/hooks/useAuth';
import { useToast } from '../../components/ToastContext';

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
 * - Displays current PSOs (users with "Employee" role) in a paged table.
 * - “Add PSO” opens a modal listing tenant-user candidates (no App Role).
 * - Modal table shows only Select, Email, First Name, Last Name.
 * - Confirming assigns the "Employee" role to selected users.
 *
 * @returns PSO management UI.
 */
const PSOsListPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const currentEmail = account?.username ?? '';
  const { showToast } = useToast();

  // State for PSO list page
  const [psos, setPsos]               = useState<CandidateUser[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(8);
  const [psosLoading, setPsosLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // State for candidate modal
  const [candidates, setCandidates]                   = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandidatesLoading]     = useState(false);
  const [isModalOpen, setModalOpen]                   = useState(false);
  const [selectedEmails, setSelectedEmails]           = useState<string[]>([]);

  useHeader({
    title:   'PSOs',
    iconSrc: managementIcon,
    iconAlt: 'PSOs',
  });

  /**
   * Fetch one page of PSOs (Employee role).
   */
  const fetchPsos = async (pageNumber = 1): Promise<void> => {
    setPsosLoading(true);
    try {
      const res = await getUsersByRole('Employee', pageNumber, pageSize);
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
      setTotal(res.total);
      setPage(res.page);
    } catch (err: any) {
      console.error('Failed to load PSOs:', err);
      showToast('Failed to load PSOs', 'error');
    } finally {
      setPsosLoading(false);
      setHasFetched(true);
    }
  };

  /**
   * Fetch all tenant-user candidates.
   */
  const fetchCandidates = async (): Promise<void> => {
    setCandidatesLoading(true);
    try {
      const res = await getUsersByRole('Tenant', 1, 1000);
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

  // On mount (when auth ready), load first page
  useEffect(() => {
    if (!initialized || !account) return;
    fetchPsos(1);
  }, [initialized, account]);

  /**
   * Opens "Add PSO" modal, resets selection, and fetches candidates.
   */
  const handleOpenModal = (): void => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  /**
   * Assign "Employee" role to selected users and refresh.
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
      await fetchPsos(page);
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
      await fetchPsos(page);
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
      {/* Main PSO table with loading indicator */}
      <TableComponent<CandidateUser>
        columns={psoColumns}
        data={psos}
        pageSize={pageSize}
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
