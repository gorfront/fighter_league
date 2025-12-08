/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import apiClient from "@/api/apiClient";

interface ProfileState {
  fighter: any;
  sponsor: any;
  donor: any;
  loading: boolean;
  error: string | null;

  fetchFighter: () => Promise<void>;
  fetchSponsor: () => Promise<void>;
  fetchDonor: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  fighter: null,
  sponsor: null,
  donor: null,
  loading: false,
  error: null,

  fetchFighter: async () => {
    try {
      set({ loading: true, error: null });
      const res = await apiClient.get("/fighters/me");
      set({ fighter: res.data, loading: false });
    } catch (err: any) {
      set({
        fighter: null,
        loading: false,
        error: err.response?.data?.message || "Failed to fetch fighter profile",
      });
    }
  },

  fetchSponsor: async () => {
    try {
      set({ loading: true, error: null });
      const res = await apiClient.get("/dashboard/sponsor/me");
      set({ sponsor: res.data, loading: false });
    } catch (err: any) {
      set({
        sponsor: null,
        loading: false,
        error: err.response?.data?.message || "Failed to fetch sponsor profile",
      });
    }
  },

  fetchDonor: async () => {
    try {
      set({ loading: true, error: null });
      const res = await apiClient.get("/donor/me");
      set({ donor: res.data, loading: false });
    } catch (err: any) {
      set({
        donor: null,
        loading: false,
        error: err.response?.data?.message || "Failed to fetch donor profile",
      });
    }
  },
}));
