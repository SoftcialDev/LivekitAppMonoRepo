import React, { useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import managementIcon from '@assets/monitor-icon.png';
import AddModal from '@/components/ModalComponent';

/**
 * Represents a single administrator.
 */
interface Admin {
  /** Unique email address of the admin. */
  email: string;
  /** First name of the admin. */
  firstName: string;
  /** Last name of the admin. */
  lastName: string;
  /** Role assigned to the admin. */
  role: string;
}

/**
 * Renders the Admins management page.
 *
 * - Sets the header to “Admins” with its icon.
 * - Shows a paginated table of existing admins.
 * - Provides an “Add Admin” button that opens a modal.
 * - Modal contains a selectable list of candidates with confirm/cancel actions.
 *
 * @component
 * @returns The Admins management interface.
 */
const AdminsPage: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title: 'Admins',
    iconSrc: managementIcon,
    iconAlt: 'Admins',
  });

  const data: Admin[] = [
    { email: 'alice@foo.com', firstName: 'Alice',  lastName: 'Anderson',   role: 'Manager'     },
    { email: 'bob@foo.com',   firstName: 'Bob',    lastName: 'Brown',      role: 'Supervisor'  },
    { email: 'carol@foo.com', firstName: 'Carol',  lastName: 'Clark',      role: 'Coordinator' },
    { email: 'dave@foo.com',  firstName: 'Dave',   lastName: 'Davis',      role: 'Analyst'     },
    { email: 'eva@foo.com',   firstName: 'Eva',    lastName: 'Evans',      role: 'Manager'     },
    { email: 'frank@foo.com', firstName: 'Frank',  lastName: 'Ford',       role: 'Supervisor'  },
    { email: 'grace@foo.com', firstName: 'Grace',  lastName: 'Green',      role: 'Coordinator' },
    { email: 'heidi@foo.com', firstName: 'Heidi',  lastName: 'Hill',       role: 'Analyst'     },
    { email: 'ivan@foo.com',  firstName: 'Ivan',   lastName: 'Iverson',    role: 'Manager'     },
    { email: 'judy@foo.com',  firstName: 'Judy',   lastName: 'Jones',      role: 'Supervisor'  },
  ];

  /**
   * Column definitions for the admin tables, including selection and delete actions.
   */
  const columns: Column<Admin>[] = [
    {
      key: 'email',
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
            appearance-none
            w-5 h-5
            rounded
            border-2 border-[var(--color-primary)]
            bg-[var(--color-primary-light)]
            checked:bg-[var(--color-secondary)]
            checked:border-[var(--color-secondary)]
            focus:ring-0 focus:outline-none
            cursor-pointer
            transition-colors
          "
        />
      ),
    },
    { key: 'email',     header: 'Email'      },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName',  header: 'Last Name'  },
    { key: 'role',      header: 'Role'       },
    {
      key: 'email',
      header: 'Actions',
      render: row => (
        <TrashButton onClick={() => console.log('Delete', row.email)} />
      ),
    },
  ];

  /**
   * Adds the selected admins, then clears the selection and closes the modal.
   *
   * @returns void
   */
  const handleConfirmAdd = (): void => {
    console.log('Adding admins:', selectedEmails);
    // TODO: replace with API call to add admins
    setSelectedEmails([]);
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<Admin>
        columns={columns.filter(c => c.header !== 'Select')}
        data={data}
        pageSize={9}
        addButton={
          <AddButton
            label="Add Admin"
            onClick={() => setModalOpen(true)}
          />
        }
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
        <TableComponent<Admin>
          columns={columns}
          data={data}
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
