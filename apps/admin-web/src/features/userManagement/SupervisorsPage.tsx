import React, { useState } from 'react';
import { useHeader } from '../../context/HeaderContext';
import { TableComponent, Column } from '../../components/TableComponent';
import AddButton from '../../components/Buttons/AddButton';
import TrashButton from '../../components/Buttons/TrashButton';
import managementIcon from '@assets/monitor-icon.png';
import AddModal from '@/components/ModalComponent';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Represents a single supervisor record.
 */
interface Supervisor {
  /** Unique email address of the supervisor. */
  email: string;
  /** First name of the supervisor. */
  firstName: string;
  /** Last name of the supervisor. */
  lastName: string;
}

////////////////////////////////////////////////////////////////////////////////
// Component
////////////////////////////////////////////////////////////////////////////////

/**
 * SupervisorsPage
 *
 * - Sets the header to “Supervisors” with its icon.
 * - Renders a paginated table of existing supervisors.
 * - Provides an “Add Supervisor” button that opens a modal.
 * - Modal shows a selectable list of candidates with Cancel/Add actions.
 *
 * @component
 * @returns The Supervisors management interface.
 */
const SupervisorsPage: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // configure header title & icon
  useHeader({
    title: 'Supervisors',
    iconSrc: managementIcon,
    iconAlt: 'Supervisors',
  });

  // mock supervisor data
  const data: Supervisor[] = Array.from({ length: 20 }, (_, i) => ({
    email:     `user${i + 1}@example.com`,
    firstName: `First${i + 1}`,
    lastName:  `Last${i + 1}`,
  }));

  /**
   * Column definitions, including a “Select” checkbox and delete action.
   */
  const columns: Column<Supervisor>[] = [
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
    {
      key: 'email',
      header: 'Actions',
      render: row => (
        <TrashButton onClick={() => console.log('Delete', row.email)} />
      ),
    },
  ];

  /**
   * Handle confirmation of adding selected supervisors.
   * Clears selection and closes the modal.
   */
  const handleConfirmAdd = (): void => {
    console.log('Adding supervisors:', selectedEmails);
    // TODO: call your API to add supervisors here
    setSelectedEmails([]);
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      {/* Main table with “Add Supervisor” toolbar button */}
      <TableComponent<Supervisor>
        columns={columns.filter(c => c.header !== 'Select')}
        data={data}
        pageSize={9}
        addButton={
          <AddButton
            label="Add Supervisor"
            onClick={() => setModalOpen(true)}
          />
        }
      />

      {/* Modal for selecting new supervisors */}
      <AddModal
        open={isModalOpen}
        title="Add Supervisor"
        iconSrc={managementIcon}
        iconAlt="Supervisors"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Add Supervisor"
      >
        {/* Inside modal: full table including the “Select” column */}
        <TableComponent<Supervisor>
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

export default SupervisorsPage;
