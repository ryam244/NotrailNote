import { create } from 'zustand';
import type { User, UserPlan } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  updatePlan: (plan: UserPlan) => void;
  setGitHubAuth: (github: User['github']) => void;
  clearGitHubAuth: () => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  updatePlan: (plan) =>
    set((state) => ({
      user: state.user ? { ...state.user, plan } : null,
    })),

  setGitHubAuth: (github) =>
    set((state) => ({
      user: state.user ? { ...state.user, github } : null,
    })),

  clearGitHubAuth: () =>
    set((state) => ({
      user: state.user ? { ...state.user, github: undefined } : null,
    })),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),
}));
