import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/api/apiClient";
import { getSocket, initializeSocket } from "@/socket/socket";

interface LoginResponse {
  token: string;
  user_type: string;
}

interface DecodedToken {
  id: number;
  email: string;
  user_type: string;
  iat: number;
  exp: number;
  name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  user_type: string;
  user_id?: number;
}

interface AuthState {
  token: string | null;
  userType: string | null;
  currentUser: AuthUser | null;
  isAuthLoading: boolean;
  socketConnected: boolean;

  initializeAuth: () => void;
  setToken: (token: string | null) => void;
  loginWithEmail: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  userType: null,
  currentUser: null,
  isAuthLoading: true,
  socketConnected: false,

  initializeAuth: () => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      set({ isAuthLoading: false });
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      const user: AuthUser = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        user_type: decoded.user_type,
      };

      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${storedToken}`;

      set({
        token: storedToken,
        userType: decoded.user_type,
        currentUser: user,
        isAuthLoading: false,
      });

      initializeSocket(user);
      set({ socketConnected: true });
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("authToken");
      set({
        token: null,
        userType: null,
        currentUser: null,
        isAuthLoading: false,
        socketConnected: false,
      });
    }
  },

  setToken: (newToken) => {
    if (!newToken) {
      localStorage.removeItem("authToken");
      delete apiClient.defaults.headers.common["Authorization"];
      set({
        token: null,
        userType: null,
        currentUser: null,
        socketConnected: false,
      });
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      const user: AuthUser = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        user_type: decoded.user_type,
      };

      localStorage.setItem("authToken", newToken);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      set({
        token: newToken,
        userType: decoded.user_type,
        currentUser: user,
      });

      initializeSocket(user);
      set({ socketConnected: true });
    } catch (err) {
      console.error("Invalid token:", err);
      set({
        token: null,
        userType: null,
        currentUser: null,
        socketConnected: false,
      });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    try {
      const loginRes = await apiClient.post<LoginResponse>(
        "/auth/login/email",
        {
          email,
          password,
        }
      );

      const { token, user_type } = loginRes.data;
      get().setToken(token);

      return { token, user_type };
    } catch (err) {
      console.error("Email login failed:", err);
      throw err;
    }
  },

  logout: () => {
    get().setToken(null);
    const socket = getSocket();
    if (socket) socket.disconnect();
  },
}));
