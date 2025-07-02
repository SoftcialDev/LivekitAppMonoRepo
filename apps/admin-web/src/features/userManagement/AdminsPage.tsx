import React, { useEffect, useState } from 'react';
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

const AdminsPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const currentEmail = account?.username ?? '';
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<CandidateUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title:   'Admins',
    iconSrc: managementIcon,
    iconAlt: 'Admins',
  });

  const fetchAdmins = async (): Promise<void> => {
    setAdminsLoading(true);
    try {
      const res = await getUsersByRole('Admin', 1, 1000);
      setAdmins(res.users);
    } catch (err: any) {
      showToast('Could not load admins', 'error');
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchCandidates = async (): Promise<void> => {
    setCandidatesLoading(true);
    try {
      const res = await getUsersByRole('Supervisor,Employee,Tenant', 1, 1000);
      setCandidates(res.users);
    } catch (err: any) {
      showToast('Could not load candidate users', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchAdmins();
  }, [initialized]);

  const handleOpenModal = (): void => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  const handleConfirmAdd = async (): Promise<void> => {
    setAdminsLoading(true);
    try {
      await Promise.all(
        selectedEmails.map(email =>
          changeUserRole({ userEmail: email, newRole: 'Admin' })
        )
      );
      setModalOpen(false);
      await fetchAdmins();
      showToast(`${selectedEmails.length} added`, 'success');
    } catch {
      showToast('Failed to add admins', 'error');
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string): Promise<void> => {
    if (email === currentEmail) {
      showToast("You can't remove yourself", 'warning');
      return;
    }
    setAdminsLoading(true);
    try {
      await changeUserRole({ userEmail: email, newRole: null });
      await fetchAdmins();
      showToast(`Removed ${email}`, 'success');
    } catch {
      showToast(`Failed to remove ${email}`, 'error');
    } finally {
      setAdminsLoading(false);
    }
  };

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
    { key: 'role',      header: 'Role'       },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<CandidateUser>
        columns={adminColumns}
        data={admins}
        pageSize={9}
        addButton={<AddButton label="Add Admin" onClick={handleOpenModal} />}
        loading={adminsLoading}
        loadingAction="Loading admins"
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
          loading={candidatesLoading}
          loadingAction="Loading candidates"
        />
      </AddModal>
    </div>
  );
};

export default AdminsPage;
