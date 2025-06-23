
import React, { useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '@components/TableComponent';
import AddButton from '@components/Buttons/AddButton';
import monitorIcon from '@assets/icon-monitor.png';
import AddModal from '@components/ModalComponent';
import TrashButton from '@/components/Buttons/TrashButton';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Shape of a single PSO record.
 */
interface PSO {
  /** PSO’s unique email address. */
  email: string;
  /** PSO’s first name. */
  firstName: string;
  /** PSO’s last name. */
  lastName: string;
  /** Assigned supervisor’s name. */
  supervisor: string;
  /** Role (always “PSO” here). */
  role: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * PSOsListPage
 *
 * - Sets the header to “PSOs” with a monitor icon.
 * - Renders a paginated table of PSOs with columns:
 *   Email, First Name, Last Name, Supervisor, Role, Actions.
 * - “Add PSO” button in toolbar opens a modal.
 * - Modal shows a selectable list of candidates with Cancel/Add PSOs controls.
 *   The modal table does *not* include the Actions column.
 *
 * @component
 * @returns The PSOs management interface.
 */
const PSOsListPage: React.FC = () => {
  const [isModalOpen, setModalOpen]         = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title: 'PSOs',
    iconSrc: monitorIcon,
    iconAlt: 'PSOs',
  });

  // Mock PSO data
  const data: PSO[] = [
    { email: 'alice.pso@collettehealth.com', firstName: 'Alice',  lastName: 'Anderson',   supervisor: 'John Doe',   role: 'PSO' },
    { email: 'bob.pso@collettehealth.com',   firstName: 'Bob',    lastName: 'Brown',      supervisor: 'Mary Smith', role: 'PSO' },
    { email: 'carol.pso@collettehealth.com', firstName: 'Carol',  lastName: 'Clark',      supervisor: 'John Doe',   role: 'PSO' },
    { email: 'dave.pso@collettehealth.com',  firstName: 'Dave',   lastName: 'Davis',      supervisor: 'Mary Smith', role: 'PSO' },
    { email: 'eva.pso@collettehealth.com',   firstName: 'Eva',    lastName: 'Evans',      supervisor: 'John Doe',   role: 'PSO' },
    { email: 'frank.pso@collettehealth.com', firstName: 'Frank',  lastName: 'Ford',       supervisor: 'Mary Smith', role: 'PSO' },
    { email: 'grace.pso@collettehealth.com', firstName: 'Grace',  lastName: 'Green',      supervisor: 'John Doe',   role: 'PSO' },
    { email: 'heidi.pso@collettehealth.com', firstName: 'Heidi',  lastName: 'Hill',       supervisor: 'Mary Smith', role: 'PSO' },
    { email: 'ivan.pso@collettehealth.com',  firstName: 'Ivan',   lastName: 'Iverson',    supervisor: 'John Doe',   role: 'PSO' },
    { email: 'judy.pso@collettehealth.com',  firstName: 'Judy',   lastName: 'Jones',      supervisor: 'Mary Smith', role: 'PSO' },
  ];

  // Full column definitions, including Select and Actions
  const allColumns: Column<PSO>[] = [
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
            appearance-none w-5 h-5 rounded
            border-2 border-[var(--color-primary)]
            bg-[var(--color-primary-light)]
            checked:bg-[var(--color-secondary)]
            checked:border-[var(--color-secondary)]
            focus:ring-0 focus:outline-none
            cursor-pointer transition-colors
          "
        />
      ),
    },
    { key: 'email',      header: 'Email'      },
    { key: 'firstName',  header: 'First Name' },
    { key: 'lastName',   header: 'Last Name'  },
    { key: 'supervisor', header: 'Supervisor' },
    { key: 'role',       header: 'Role'       },
    {
      key: 'email',
      header: 'Actions',
      render: row => (
        <TrashButton
          onClick={() => console.log('Delete PSO:', row.email)}
        />
      ),
    },
  ];

  /**
   * Confirm adding the selected PSOs.
   * Clears selection and closes modal.
   */
  const handleConfirmAdd = (): void => {
    console.log('Adding PSOs:', selectedEmails);
    // TODO: call API to add PSOs
    setSelectedEmails([]);
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      {/* Main table with Add PSO toolbar button */}
      <TableComponent<PSO>
        columns={allColumns.filter(c => c.header !== 'Select')}
        data={data}
        pageSize={8}
        addButton={
          <AddButton
            label="Add PSO"
            onClick={() => setModalOpen(true)}
          />
        }
      />

      {/* Modal for batch-adding PSOs */}
      <AddModal
        open={isModalOpen}
        title="Add PSOs"
        iconSrc={monitorIcon}
        iconAlt="PSOs"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Add Selected"
      >
        <TableComponent<PSO>
          columns={allColumns.filter(c => c.header !== 'Actions')}
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

export default PSOsListPage;
