/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import apiClient from "@/api/apiClient";
import { Fighter } from "@/types/fighter";

interface FighterState {
  fighter: Partial<Fighter>;
  loading: boolean;
  error: string | null;
  fetchFighter: () => Promise<void>;
}

export const useFighterStore = create<FighterState>((set) => ({
  fighter: null,
  loading: false,
  error: null,

  fetchFighter: async () => {
    try {
      set({ loading: true });
      const res = await apiClient.get("/fighters/me");
      set({ fighter: res.data, loading: false, error: null });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch fighter",
        loading: false,
      });
    }
  },
}));
