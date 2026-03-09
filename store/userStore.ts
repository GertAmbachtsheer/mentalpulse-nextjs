import { create } from 'zustand';

type UserRole = 'user' | 'admin' | null;

interface UserState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));
