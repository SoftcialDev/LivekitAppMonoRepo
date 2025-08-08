import React, { useEffect, useState } from 'react';
import managementIcon from '@/shared/assets/manage_icon_sidebar.png';
import { ContactManagerDTO, getContactManagers, revokeContactManager, upsertContactManager } from '@/shared/api/contactManagerClient';
import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/ui/ToastContext';
import { useHeader } from '@/app/providers/HeaderContext';
import { getUsersByRole, UserByRole } from '@/shared/api/userClient';
import { Column, TableComponent } from '@/shared/ui/TableComponent';
import AddButton from '@/shared/ui/Buttons/AddButton';
import TrashButton from '@/shared/ui/Buttons/TrashButton';
import AddModal from '@/shared/ui/ModalComponent';


/**
 * A row in the profile table, extending the DTO with UI-only fields.
 */
type ProfileRow = ContactManagerDTO & {
  /** Unique key for TableComponent */
  azureAdObjectId: string;
  /** First name extracted from fullName */
  firstName: string;
  /** Last name extracted from fullName */
  lastName: string;
  /** Role label (always "ContactManager") */
  role: 'ContactManager';
};

/**
 * AddContactManagerPage
 *
 * - Displays current Contact Managers.
 * - Lets Admins add new Contact Managers by selecting from all users.
 * - Supports revoking and shows status as plain text.
 */
const AddContactManagerPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const { showToast } = useToast();

  // State for existing profiles
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // State for candidate users
  const [candidates, setCandidates] = useState<UserByRole[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Modal & selection state
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title: 'Contact Managers',
    iconSrc: managementIcon,
    iconAlt: 'Contact Managers',
  });

  /**
   * Fetches all Contact Manager profiles, splits fullName into
   * firstName/lastName, sets role to "ContactManager", and updates state.
   */
  const fetchProfiles = async (): Promise<void> => {
    setLoadingProfiles(true);
    try {
      const raw = await getContactManagers();
      const list: ContactManagerDTO[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any).contactManagers)
          ? (raw as any).contactManagers
          : [];

      const rows: ProfileRow[] = list.map(p => {
        const parts = p.fullName.trim().split(/\s+/);
        const firstName = parts.shift() || '';
        const lastName = parts.join(' ');
        return {
          ...p,
          azureAdObjectId: p.id,
          firstName,
          lastName,
          role: 'ContactManager',
        };
      });

      setProfiles(rows);
    } catch (err: any) {
      console.error('fetchProfiles error:', err);
      showToast('Failed to load Contact Managers', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  };

  /**
   * Fetches all Supervisors, Employees, Tenants and Admins,
   * excluding the current signed-in account, and updates candidate list.
   */
  const fetchCandidates = async (): Promise<void> => {
    setLoadingCandidates(true);
    try {
      const res = await getUsersByRole('Supervisor,Employee,Tenant,Admin', 1, 1000);
      const allUsers: UserByRole[] = Array.isArray(res.users) ? res.users : [];
      const filtered = allUsers.filter(u =>
        u.email.toLowerCase() !== account?.username.toLowerCase()
      );
      setCandidates(filtered);
    } catch (err: any) {
      console.error('fetchCandidates error:', err);
      showToast('Could not load candidate users', 'error');
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchProfiles();
  }, [initialized]);

  /**
   * Opens the Add CM modal and loads candidate users.
   */
  const handleOpenModal = (): void => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  /**
   * Adds each selected email as a new Contact Manager,
   * then refreshes the profile list.
   */
  const handleConfirmAdd = async (): Promise<void> => {
    setLoadingProfiles(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          upsertContactManager({ email, status: 'Unavailable' })
        )
      );
      setModalOpen(false);
      await fetchProfiles();
      showToast(`${selectedEmails.length} added`, 'success');
    } catch (err: any) {
      console.error('handleConfirmAdd error:', err);
      showToast('Failed to add Contact Managers', 'error');
    } finally {
      setLoadingProfiles(false);
    }
  };

  /**
   * Revokes a Contact Manager by profile ID, then reloads profiles.
   *
   * @param id Profile UUID to revoke
   */
  const handleRevoke = async (id: string): Promise<void> => {
    try {
      await revokeContactManager(id);
      showToast('Revoked', 'success');
      await fetchProfiles();
    } catch (err: any) {
      console.error('handleRevoke error:', err);
      showToast('Failed to revoke', 'error');
    }
  };

  // Columns configuration for existing profiles
  const profileColumns: Column<ProfileRow>[] = [
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName',  header: 'Last Name' },
    { key: 'email',     header: 'Email' },
    {
      key: 'status',
      header: 'Status',
      render: row => row.status,
    },
    { key: 'role', header: 'Role' },
    {
      key: 'actions',
      header: 'Actions',
      render: row => <TrashButton onClick={() => handleRevoke(row.id)} />,
    },
  ];

  // Columns for candidate selection
  const candidateColumns: Column<UserByRole>[] = [
    {
      key: 'azureAdObjectId',
      header: 'Select',
      render: row => (
        <input
          type="checkbox"
          checked={selectedEmails.includes(row.email)}
          onChange={e => setSelectedEmails(prev =>
            e.target.checked ? [...prev, row.email] : prev.filter(x => x !== row.email)
          )}
          className="appearance-none w-5 h-5 rounded border-2 border-white checked:bg-[var(--color-secondary)]"
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
      <TableComponent<ProfileRow>
        columns={profileColumns}
        data={profiles}
        pageSize={5}
        loading={loadingProfiles}
        loadingAction="Loading managers"
        addButton={<AddButton label="Add Contact Manager" onClick={handleOpenModal} />}
      />

      <AddModal
        open={isModalOpen}
        title="Add Contact Managers"
        iconSrc={managementIcon}
        iconAlt="Managers"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Add Contact Managers"
      >
        <TableComponent<UserByRole>
          columns={candidateColumns}
          data={candidates}
          pageSize={5}
          loading={loadingCandidates}
          loadingAction="Loading candidates"
          addButton={null}
        />
      </AddModal>
    </div>
  );
};

export default AddContactManagerPage;
