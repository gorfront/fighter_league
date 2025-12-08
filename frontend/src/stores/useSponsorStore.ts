/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import apiClient from "@/api/apiClient";
import { Sponsor } from "@/types/fighter";

interface SponsorState {
  sponsor: Partial<Sponsor>;
  loading: boolean;
  error: string | null;
  fetchSponsor: () => Promise<void>;
}

export const useSponsorStore = create<SponsorState>((set) => ({
  sponsor: null,
  loading: false,
  error: null,

  fetchSponsor: async () => {
    try {
      set({ loading: true });
      const res = await apiClient.get("/dashboard/sponsor/me");
      set({ sponsor: res.data, loading: false });
    } catch (err: any) {
      set({
        sponsor: null,
        error: err.response?.data?.message || "Failed to load sponsor profile",
        loading: false,
      });
    }
  },
}));
