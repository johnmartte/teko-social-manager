"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthStatus } from "@/lib/types";
import { api } from "@/lib/api";

const RAILWAY_API_URL = "https://teko-social-manager-production.up.railway.app";

function resolveApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || RAILWAY_API_URL;
}

const API_URL = resolveApiUrl();

type AppUser = {
  id: number;
  name: string;
  email: string;
};

type AuthContextType = {
  status: AuthStatus | null;
  user: AppUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  refresh: () => void;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  updateEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  disconnectSocial: (platform?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  status: null,
  user: null,
  isAuthenticated: false,
  loading: true,
  refresh: () => {},
  registerWithEmail: async () => {},
  loginWithEmail: async () => {},
  updateEmail: async () => {},
  updatePassword: async () => {},
  disconnectSocial: async () => {},
  logout: () => {},
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStatusFromStorage(): AuthStatus {
  const igToken   = localStorage.getItem("ig_token");
  const igUserId  = localStorage.getItem("ig_user_id");
  const fbToken   = localStorage.getItem("fb_token");
  const fbPageId  = localStorage.getItem("fb_page_id");
  const fbPageName = localStorage.getItem("fb_page_name");

  return {
    instagram: { connected: !!(igToken && igUserId), userId: igUserId },
    facebook:  { connected: !!fbToken, pageId: fbPageId, pageName: fbPageName },
  };
}

function readUserFromStorage(): AppUser | null {
  const token   = localStorage.getItem("app_token");
  const userRaw = localStorage.getItem("app_user");
  if (!token || !userRaw) return null;
  try {
    return JSON.parse(userRaw) as AppUser;
  } catch {
    return null;
  }
}

async function postSystemAuth<T>(path: string, payload: Record<string, string>): Promise<T> {
  return requestSystemAuth<T>(path, { method: "POST", payload });
}

async function requestSystemAuth<T>(
  path: string,
  {
    method,
    payload,
    token,
  }: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    payload?: Record<string, string>;
    token?: string;
  }
): Promise<T> {
  const candidateUrls = [`${API_URL}/api${path}`, `${API_URL}${path}`];
  let lastMessage = "No se pudo completar la solicitud";

  for (const url of candidateUrls) {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    let data: unknown = null;
    try { data = await res.json(); } catch { data = null; }

    if (res.ok) return data as T;

    const message =
      (data as { message?: string } | null)?.message ||
      (data as { error?: string } | null)?.error ||
      "Error desconocido";

    lastMessage = message;
    if (res.status !== 404) break;
  }

  throw new Error(lastMessage);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [user, setUser]     = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch social status from backend (/auth/me when Sanctum token exists,
   * or /auth/status as fallback). Updates both status + user state.
   */
  const fetchStatus = useCallback(async () => {
    const appToken = localStorage.getItem("app_token");

    if (appToken) {
      try {
        const data = await api<{
          user: AppUser;
          instagram: AuthStatus["instagram"];
          facebook: AuthStatus["facebook"];
        }>("/auth/me");

        setUser(data.user);
        localStorage.setItem("app_user", JSON.stringify(data.user));
        setStatus({ instagram: data.instagram, facebook: data.facebook });
        setLoading(false);
        return;
      } catch {
        // Token is stale (DB was wiped on redeploy, etc.) — clear it
        // so we don't keep retrying /auth/me in an infinite loop.
        localStorage.removeItem("app_token");
        localStorage.removeItem("app_user");
      }
    }

    // Fallback: read from localStorage (old header-based sessions)
    setStatus(readStatusFromStorage());
    setUser(readUserFromStorage());
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const registerWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const data = await postSystemAuth<{ token: string; user: AppUser }>(
      "/auth/system/register",
      { name, email, password }
    );
    localStorage.setItem("app_token", data.token);
    localStorage.setItem("app_user", JSON.stringify(data.user));
    setUser(data.user);
    await fetchStatus();
  }, [fetchStatus]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const data = await postSystemAuth<{ token: string; user: AppUser }>(
      "/auth/system/login",
      { email, password }
    );
    localStorage.setItem("app_token", data.token);
    localStorage.setItem("app_user", JSON.stringify(data.user));
    setUser(data.user);
    // Fetch social status now that we have a token
    await fetchStatus();
  }, [fetchStatus]);

  const updateEmail = useCallback(async (newEmail: string, currentPassword: string) => {
    const appToken = localStorage.getItem("app_token");
    if (!appToken) throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
    const data = await requestSystemAuth<{ user: AppUser }>("/auth/system/email", {
      method: "PATCH",
      payload: { email: newEmail, current_password: currentPassword },
      token: appToken,
    });
    localStorage.setItem("app_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const appToken = localStorage.getItem("app_token");
    if (!appToken) throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
    await requestSystemAuth<{ success: boolean }>("/auth/system/password", {
      method: "PATCH",
      payload: { current_password: currentPassword, new_password: newPassword },
      token: appToken,
    });
  }, []);

  const disconnectSocial = useCallback(async (platform?: string) => {
    const appToken = localStorage.getItem("app_token");
    if (!appToken) return;
    await requestSystemAuth<{ success: boolean }>("/auth/disconnect", {
      method: "POST",
      payload: platform ? { platform } : {},
      token: appToken,
    });
    await fetchStatus();
  }, [fetchStatus]);

  const logout = useCallback(() => {
    const appToken = localStorage.getItem("app_token");
    if (appToken) {
      void requestSystemAuth<{ success: boolean }>("/auth/system/logout", {
        method: "POST",
        token: appToken,
      });
    }
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
    setStatus(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("auth") === "success") {
      // ── New system: OAuth callback returns app_token ──────────────────────
      const appToken = params.get("app_token");
      const userName = params.get("user_name");

      if (appToken) {
        localStorage.setItem("app_token", appToken);
        if (userName) {
          const partial: AppUser = { id: 0, name: userName, email: "" };
          localStorage.setItem("app_user", JSON.stringify(partial));
        }
        // Clean URL then fetch full status from backend
        window.history.replaceState({}, "", "/");
        void fetchStatus();
        return;
      }

      // ── Legacy fallback: OAuth callback returned raw tokens ───────────────
      const igToken   = params.get("ig_token");
      const igUserId  = params.get("ig_user_id");
      const fbToken   = params.get("fb_token");
      const fbPageId  = params.get("fb_page_id");
      const fbPageName = params.get("fb_page_name");

      if (igToken)    localStorage.setItem("ig_token", igToken);
      if (igUserId)   localStorage.setItem("ig_user_id", igUserId);
      if (fbToken)    localStorage.setItem("fb_token", fbToken);
      if (fbPageId)   localStorage.setItem("fb_page_id", fbPageId);
      if (fbPageName) localStorage.setItem("fb_page_name", fbPageName);

      window.history.replaceState({}, "", "/");
    }

    void fetchStatus();
  }, [fetchStatus]);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isAuthenticated: !!user,
        loading,
        refresh,
        registerWithEmail,
        loginWithEmail,
        updateEmail,
        updatePassword,
        disconnectSocial,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
