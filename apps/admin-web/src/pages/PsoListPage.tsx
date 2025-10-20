import React, { useEffect, useState } from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { useHeader } from '@/app/providers/HeaderContext';
import { getUsersByRole, changeUserRole, deleteUser, changeSupervisor, UserByRole } from '@/shared/api/userClient';
import { useAuth } from '@/shared/auth/useAuth';
import AddButton from '@/shared/ui/Buttons/AddButton';
import { SearchableDropdown, DropdownOption } from '@/shared/ui/SearchableDropdown';
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
  const [allPsos, setAllPsos]         = useState<CandidateUser[]>([]);
  const [psosLoading, setPsosLoading] = useState(false);

  // State for candidate modal
  const [candidates, setCandidates]               = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [isModalOpen, setModalOpen]               = useState(false);
  const [selectedEmails, setSelectedEmails]       = useState<string[]>([]);
  const [filterSupervisorValues, setFilterSupervisorValues] = useState<string[]>([]);
  const [filterSupervisorOptions, setFilterSupervisorOptions] = useState<DropdownOption<string>[]>([]);
  const [transferSupervisorOptions, setTransferSupervisorOptions] = useState<DropdownOption<string>[]>([]);
  const [transferToValue, setTransferToValue]     = useState<string[]>([]); // single-select via last value (email)
  
  // State for transfer confirmation modal
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<{
    supervisorEmail: string;
    supervisorName: string;
    psoCount: number;
  } | null>(null);

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
      const mappedAll: CandidateUser[] = res.users.map(u => ({
        azureAdObjectId: u.azureAdObjectId,
        email:           u.email,
        firstName:       u.firstName,
        lastName:        u.lastName,
        role:            'Employee',
        supervisorAdId:  u.supervisorAdId,
        supervisorName:  u.supervisorName,
      }));
      setAllPsos(mappedAll);
      // Apply current filter locally
      if (filterSupervisorValues.length > 0) {
        const allow = new Set(filterSupervisorValues);
        setPsos(mappedAll.filter(p => p.supervisorName && allow.has(p.supervisorName)));
      } else {
        setPsos(mappedAll);
      }
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
      const res = await getUsersByRole('Unassigned', 1, API_PAGE_SIZE);
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
    // Load supervisors for dropdowns
    (async () => {
      try {
        const supRes = await getUsersByRole('Supervisor', 1, 500);
        const filterOpts: DropdownOption<string>[] = supRes.users.map((s: UserByRole) => ({
          label: `${s.firstName} ${s.lastName}`,
          value: s.azureAdObjectId,
        }));
        const transferOpts: DropdownOption<string>[] = supRes.users.map((s: UserByRole) => ({
          label: `${s.firstName} ${s.lastName}`,
          value: s.email,
        }));
        setFilterSupervisorOptions(filterOpts);
        setTransferSupervisorOptions(transferOpts);
      } catch {
        // ignore
      }
    })();
  }, [initialized, account]);

  // Apply supervisor filter client-side without fetching
  useEffect(() => {
    if (filterSupervisorValues.length === 0) {
      setPsos(allPsos);
    } else {
      const allow = new Set(filterSupervisorValues);
      setPsos(
        allPsos.filter(p => (p.supervisorAdId && allow.has(p.supervisorAdId)))
      );
    }
  }, [filterSupervisorValues, allPsos]);

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
      await fetchCandidates(); // Refresh candidates list
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
      await deleteUser({ userEmail: email, reason: 'PSO role removed' });
      await fetchPsos();
      await fetchCandidates(); // Refresh candidates list
      showToast(`Removed ${email}`, 'success');
    } catch (err: any) {
      console.error('Error removing PSO:', err);
      showToast(`Failed to remove ${email}`, 'error');
    } finally {
      setPsosLoading(false);
    }
  };

  /**
   * Handle transfer confirmation - execute the actual transfer
   */
  const handleConfirmTransfer = async (): Promise<void> => {
    if (!pendingTransfer) return;
    
    setPsosLoading(true);
    try {
      const updated = await changeSupervisor({ 
        userEmails: selectedEmails, 
        newSupervisorEmail: pendingTransfer.supervisorEmail 
      });
      showToast(`Transferred ${updated} PSO(s) to ${pendingTransfer.supervisorName}`, 'success');
      // refresh list in place
      await fetchPsos();
      setSelectedEmails([]);
      setTransferToValue([]);
      setTransferModalOpen(false);
      setPendingTransfer(null);
    } catch (e) {
      console.error('Transfer failed', e);
      showToast('Transfer failed', 'error');
    } finally {
      setPsosLoading(false);
    }
  };

  /**
   * Handle transfer cancellation
   */
  const handleCancelTransfer = (): void => {
    setTransferModalOpen(false);
    setPendingTransfer(null);
    setTransferToValue([]);
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

  // Toolbar right actions: Filter by Supervisor (if Supervisor) + Select All + Transfer To (placeholder)
  // Left controls (toolbar left) — compose Add + filters
  const leftControls = (
    <div className="flex items-center gap-2">
      <AddButton label="Add PSO" onClick={handleOpenModal} />
      {/* Filter by Supervisor (multi-select) */}
      <SearchableDropdown
        options={filterSupervisorOptions}
        selectedValues={filterSupervisorValues}
        onSelectionChange={(vals) => { setFilterSupervisorValues(vals); }}
        placeholder="Filter by Supervisor"
        className="flex-1"
        usePortal={true}
        closeOnSelect={false}
      />
      {/* Transfer To — single select, keep only last */}
      <SearchableDropdown
        options={transferSupervisorOptions}
        selectedValues={transferToValue}
        onSelectionChange={(vals) => {
          if (vals.length === 0) { setTransferToValue([]); return; }
          const chosen = vals[vals.length - 1] as string;
          setTransferToValue([chosen]);
          if (selectedEmails.length === 0) {
            showToast('Select at least one PSO to transfer', 'warning');
            return;
          }
          
          // Find supervisor name for confirmation
          const supervisor = transferSupervisorOptions.find(opt => opt.value === chosen);
          if (!supervisor) {
            showToast('Supervisor not found', 'error');
            return;
          }
          
          // Show confirmation modal instead of executing immediately
          setPendingTransfer({
            supervisorEmail: chosen,
            supervisorName: supervisor.label,
            psoCount: selectedEmails.length
          });
          setTransferModalOpen(true);
        }}
        placeholder="Transfer To"
        className="flex-1"
        usePortal={true}
      />
    </div>
  );

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
        addButton={leftControls}
        loading={psosLoading}
        loadingAction="Loading PSOs"
        showRowCheckboxes={true}
        getRowKey={(row) => row.email}
        selectedKeys={selectedEmails}
        onToggleRow={(key, checked) => setSelectedEmails(prev => checked ? Array.from(new Set([...prev, key])) : prev.filter(k => k !== key))}
        onToggleAll={(checked, keys) => setSelectedEmails(checked ? Array.from(new Set([...selectedEmails, ...keys])) : selectedEmails.filter(k => !keys.includes(k)))}
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

      {/* Transfer Confirmation Modal */}
      <AddModal
        open={isTransferModalOpen}
        title="Confirm Transfer"
        iconSrc={managementIcon}
        iconAlt="Transfer"
        onClose={handleCancelTransfer}
        onConfirm={handleConfirmTransfer}
        confirmLabel="Confirm Transfer"
        loading={psosLoading}
        loadingAction="Transferring PSOs"
        classNameOverride="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--color-primary-light)] border-2 border-white rounded-lg shadow-xl w-fit z-50"
      >
        <div className="text-center py-4">
          <p className="text-lg mb-4">
            Are you sure you want to transfer <strong>{pendingTransfer?.psoCount || 0}</strong> PSO(s) to:
          </p>
          <p className="text-xl font-semibold text-[var(--color-secondary)] mb-4">
            {pendingTransfer?.supervisorName || 'Unknown Supervisor'}
          </p>
        </div>
      </AddModal>
    </div>
  );
};

export default PSOsListPage;
