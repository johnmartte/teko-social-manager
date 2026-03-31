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

type AuthContextType = {
  status: AuthStatus | null;
  loading: boolean;
  refresh: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  status: null,
  loading: true,
  refresh: () => {},
  logout: () => {},
});

function readStatusFromStorage(): AuthStatus {
  const igToken = localStorage.getItem("ig_token");
  const igUserId = localStorage.getItem("ig_user_id");
  const fbToken = localStorage.getItem("fb_token");
  const fbPageId = localStorage.getItem("fb_page_id");
  const fbPageName = localStorage.getItem("fb_page_name");

  return {
    instagram: {
      connected: !!(igToken && igUserId),
      userId: igUserId,
    },
    facebook: {
      connected: !!fbToken,
      pageId: fbPageId,
      pageName: fbPageName,
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setStatus(readStatusFromStorage());
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ig_token");
    localStorage.removeItem("ig_user_id");
    localStorage.removeItem("fb_token");
    localStorage.removeItem("fb_page_id");
    localStorage.removeItem("fb_page_name");
    setStatus(readStatusFromStorage());
    window.location.href = "/";
  }, []);

  useEffect(() => {
    // Extract tokens from URL params after OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      const igToken = params.get("ig_token");
      const igUserId = params.get("ig_user_id");
      const fbToken = params.get("fb_token");
      const fbPageId = params.get("fb_page_id");
      const fbPageName = params.get("fb_page_name");

      if (igToken) localStorage.setItem("ig_token", igToken);
      if (igUserId) localStorage.setItem("ig_user_id", igUserId);
      if (fbToken) localStorage.setItem("fb_token", fbToken);
      if (fbPageId) localStorage.setItem("fb_page_id", fbPageId);
      if (fbPageName) localStorage.setItem("fb_page_name", fbPageName);

      // Clean up URL
      window.history.replaceState({}, "", "/");
    }

    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ status, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
