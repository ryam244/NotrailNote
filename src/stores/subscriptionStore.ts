import { create } from 'zustand';
import type { CustomerInfo } from 'react-native-purchases';
import type { SubscriptionPlan } from '@/services/subscription';

interface SubscriptionState {
  isInitialized: boolean;
  isLoading: boolean;
  currentPlan: SubscriptionPlan;
  isPro: boolean;
  isBasic: boolean;
  expirationDate: string | null;
  customerInfo: CustomerInfo | null;
  error: string | null;
}

interface SubscriptionActions {
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSubscription: (data: {
    currentPlan: SubscriptionPlan;
    isPro: boolean;
    isBasic: boolean;
    expirationDate: string | null;
    customerInfo: CustomerInfo | null;
  }) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: SubscriptionState = {
  isInitialized: false,
  isLoading: false,
  currentPlan: 'free',
  isPro: false,
  isBasic: false,
  expirationDate: null,
  customerInfo: null,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>(
  (set) => ({
    ...initialState,

    setInitialized: (initialized) => set({ isInitialized: initialized }),

    setLoading: (loading) => set({ isLoading: loading }),

    setSubscription: (data) =>
      set({
        currentPlan: data.currentPlan,
        isPro: data.isPro,
        isBasic: data.isBasic,
        expirationDate: data.expirationDate,
        customerInfo: data.customerInfo,
        error: null,
      }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
  })
);
