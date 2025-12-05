import { create } from 'zustand';
import { getUsersByRole, UserByRole } from '@/shared/api/userClient';

const SUPERVISORS_TTL_MS = 5 * 60 * 1000; // 5 minutes

type State = {
  supervisors: UserByRole[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  loadSupervisors: (force?: boolean) => Promise<void>;
  invalidate: () => void;
};

export const useSupervisorsStore = create<State>((set, get) => ({
  supervisors: [],
  loading: false,
  error: null,
  lastLoadedAt: null,

  loadSupervisors: async (force = false) => {
    const { loading, lastLoadedAt, supervisors } = get();
    const now = Date.now();

    if (
      !force &&
      !loading &&
      supervisors.length > 0 &&
      lastLoadedAt &&
      now - lastLoadedAt < SUPERVISORS_TTL_MS
    ) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const { users } = await getUsersByRole('Supervisor', 1, 1000);
      set({
        supervisors: users,
        lastLoadedAt: Date.now(),
      });
    } catch (err: any) {
      set({
        error: err?.message ?? 'Failed to load supervisors',
        supervisors: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  invalidate: () => set({ supervisors: [], lastLoadedAt: null, error: null }),
}));

