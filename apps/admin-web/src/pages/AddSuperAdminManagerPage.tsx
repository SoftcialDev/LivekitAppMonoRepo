import React, { useEffect, useState } from "react";
import managementIcon from "@/shared/assets/manage_icon_sidebar.png";
import { useAuth } from "@/shared/auth/useAuth";
import { useToast } from "@/shared/ui/ToastContext";
import { useHeader } from "@/app/providers/HeaderContext";
import { Column, TableComponent } from "@/shared/ui/TableComponent";
import AddButton from "@/shared/ui/Buttons/AddButton";
import TrashButton from "@/shared/ui/Buttons/TrashButton";
import AddModal from "@/shared/ui/ModalComponent";

import {
  type SuperAdminDto,
  getSuperAdmins,
  createSuperAdmin,
  deleteSuperAdmin,
} from "@/shared/api/SuperAdminClient";

import { getUsersByRole, type UserByRole } from "@/shared/api/userClient";

/**
 * A row in the Super Admin table, extending the DTO with UI-only fields.
 */
type SuperAdminRow = SuperAdminDto & {
  firstName: string;
  lastName: string;
};

const AddSuperAdminPage: React.FC = () => {
  const { initialized, account } = useAuth();
  const { showToast } = useToast();

  // 👇 Igual que en AdminsPage: email actual para comparaciones
  const currentEmail = account?.username ?? "";
  const meEmailLower = currentEmail.toLowerCase();

  // Existing Super Admins
  const [profiles, setProfiles] = useState<SuperAdminRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Candidate users to promote
  const [candidates, setCandidates] = useState<UserByRole[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Modal & selection state
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useHeader({
    title: "Super Admins",
    iconSrc: managementIcon,
    iconAlt: "Super Admins",
  });

  const fetchProfiles = async (): Promise<void> => {
    setLoadingProfiles(true);
    try {
      const list = await getSuperAdmins();
      const rows: SuperAdminRow[] = list.map((p) => {
        const parts = (p.fullName ?? "").trim().split(/\s+/);
        const firstName = parts.shift() || "";
        const lastName = parts.join(" ");
        return { ...p, firstName, lastName };
      });
      setProfiles(rows);
    } catch (err: any) {
      console.error("fetchProfiles error:", err);
      showToast("Failed to load Super Admins", "error");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchCandidates = async (): Promise<void> => {
    setLoadingCandidates(true);
    try {
      const res = await getUsersByRole(
        "Supervisor,Employee,Tenant,Admin,ContactManager",
        1,
        1000
      );

      const allUsers: UserByRole[] = Array.isArray(res.users) ? res.users : [];
      const me = meEmailLower;

      const existingEmails = new Set(profiles.map((p) => p.email.toLowerCase()));
      const filtered = allUsers.filter(
        (u) => u.email.toLowerCase() !== me && !existingEmails.has(u.email.toLowerCase())
      );

      setCandidates(filtered);
    } catch (err: any) {
      console.error("fetchCandidates error:", err);
      showToast("Could not load candidate users", "error");
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (!initialized) return;
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const handleOpenModal = (): void => {
    setSelectedEmails([]);
    setModalOpen(true);
    fetchCandidates();
  };

  const handleConfirmAdd = async (): Promise<void> => {
    setLoadingProfiles(true);
    try {
      await Promise.all(selectedEmails.map((email) => createSuperAdmin(email)));
      setModalOpen(false);
      await fetchProfiles();
      showToast(`${selectedEmails.length} promoted`, "success");
    } catch (err: any) {
      console.error("handleConfirmAdd error:", err);
      showToast("Failed to promote Super Admins", "error");
    } finally {
      setLoadingProfiles(false);
    }
  };

  /**
   * Revokes (deletes) a Super Admin by user id, then refreshes the list.
   * - Bloquea auto-revocarte.
   * - Evita dejar el sistema sin Super Admin.
   */
  const handleRevoke = async (id: string): Promise<void> => {
    const target = profiles.find((p) => p.id === id);

    // 🚫 No permitir revocarte a ti mismo
    if (target && target.email.toLowerCase() === meEmailLower) {
      showToast("You cannot revoke your own Super Admin role", "warning");
      return;
    }

    // 🛡️ (Opcional recomendado) Evitar quedarse sin ningún Super Admin
    if (profiles.length <= 1) {
      showToast("At least one Super Admin must remain", "warning");
      return;
    }

    try {
      await deleteSuperAdmin(id);
      showToast("Revoked", "success");
      await fetchProfiles();
    } catch (err: any) {
      console.error("handleRevoke error:", err);
      showToast("Failed to revoke", "error");
    }
  };

  const profileColumns: Column<SuperAdminRow>[] = [
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) => row.role, // "Super Admin" del mapper del client
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        // 👇 Igual que en AdminsPage: oculta delete para el propio usuario
        row.email.toLowerCase() === meEmailLower || profiles.length <= 1
          ? null
          : <TrashButton onClick={() => handleRevoke(row.id)} />,
    },
  ];

  const candidateColumns: Column<UserByRole>[] = [
    {
      key: "azureAdObjectId",
      header: "Select",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedEmails.includes(row.email)}
          onChange={(e) =>
            setSelectedEmails((prev) =>
              e.target.checked
                ? [...prev, row.email]
                : prev.filter((x) => x !== row.email)
            )
          }
          className="appearance-none w-5 h-5 rounded border-2 border-white checked:bg-[var(--color-secondary)]"
        />
      ),
    },
    { key: "email", header: "Email" },
    { key: "firstName", header: "First Name" },
    { key: "lastName", header: "Last Name" },
    { key: "role", header: "Role" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-primary-dark)] p-4">
      <TableComponent<SuperAdminRow>
        columns={profileColumns}
        data={profiles}
        pageSize={5}
        loading={loadingProfiles}
        loadingAction="Loading super admins"
        addButton={<AddButton label="Add Super Admin" onClick={handleOpenModal} />}
      />

      <AddModal
        open={isModalOpen}
        title="Add Super Admins"
        iconSrc={managementIcon}
        iconAlt="Super Admins"
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAdd}
        confirmLabel="Promote to Super Admin"
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

export default AddSuperAdminPage;
