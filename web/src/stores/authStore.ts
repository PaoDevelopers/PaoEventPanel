import { create } from "zustand";
import { isAxiosError } from "axios";
import type { User } from "@/types";
import { login as apiLogin, getMe } from "@/api/auth";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

// setTimeout overflows above 2^31-1 ms (~24.8 days)
const MAX_TIMEOUT = 2_147_483_647;

let initialized = false;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function isCurrentToken(token: string): boolean {
  return localStorage.getItem("token") === token;
}

function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const exp = tokenExpiry(token);
  return exp !== null && exp <= Date.now();
}

function scheduleExpiry(token: string) {
  clearTimeout(expiryTimer);
  const exp = tokenExpiry(token);
  if (exp === null) return;
  expiryTimer = setTimeout(() => {
    if (!isCurrentToken(token)) return;
    if (isExpired(token)) {
      useAuthStore.getState().logout();
    } else {
      scheduleExpiry(token);
    }
  }, Math.min(Math.max(exp - Date.now(), 0), MAX_TIMEOUT));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoggedIn: false,

  login: async (username: string, password: string) => {
    const result = await apiLogin(username, password);
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    set({ token: result.token, user: result.user, isLoggedIn: true });
    scheduleExpiry(result.token);
  },

  logout: () => {
    clearTimeout(expiryTimer);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null, isLoggedIn: false });
  },

  init: () => {
    if (initialized) return;
    initialized = true;

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) return;

    let user: User;
    try {
      user = JSON.parse(userStr) as User;
    } catch {
      get().logout();
      return;
    }
    if (isExpired(token)) {
      get().logout();
      return;
    }

    // Stay logged out until the server confirms the token, so admin controls never render for a dead session
    set({ token, user });
    getMe()
      .then((freshUser) => {
        if (!isCurrentToken(token)) return;
        localStorage.setItem("user", JSON.stringify(freshUser));
        set({ user: freshUser, isLoggedIn: true });
        scheduleExpiry(token);
      })
      .catch((error) => {
        if (!isCurrentToken(token)) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status !== undefined && status < 500) {
          // Token rejected or user gone (401 is already handled by the response interceptor)
          get().logout();
        } else {
          // Network or server error: keep the cached session instead of discarding a valid token
          set({ isLoggedIn: true });
          scheduleExpiry(token);
        }
      });
  },
}));
