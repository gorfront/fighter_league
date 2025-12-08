/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import apiClient from "@/api/apiClient";

interface DonorState {
  donor: any;
  loading: boolean;
  error: string | null;
  fetchDonor: () => Promise<void>;
}

export const useDonorStore = create<DonorState>((set) => ({
  donor: null,
  loading: false,
  error: null,

  fetchDonor: async () => {
    try {
      set({ loading: true });
      const res = await apiClient.get("/donor/me");
      set({ donor: res.data, loading: false, error: null });
    } catch (err: any) {
      set({
        donor: null,
        error: err.response?.data?.message || "Failed to load donor",
        loading: false,
      });
    }
  },
}));
