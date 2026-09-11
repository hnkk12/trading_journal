import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_USER: User = {
  id: "1",
  email: "trader@tradingjournal.app",
  name: "Trader",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const cached = localStorage.getItem("tj_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fallback
      }
    }
    return DEFAULT_USER;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      if (urlToken) {
        window.history.replaceState({}, "", window.location.pathname);
        try {
          await loginWithToken(urlToken);
        } catch {
          // ignore
        }
        return;
      }

      const cachedToken = localStorage.getItem("tj_token");
      if (cachedToken) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
          localStorage.setItem("tj_user", JSON.stringify(res.data));
        } catch {
          // keep DEFAULT_USER
        }
      }
    }
    init();
  }, []);

  async function loginWithToken(token: string) {
    localStorage.setItem("tj_token", token);
    try {
      const res = await api.get("/auth/me");
      localStorage.setItem("tj_user", JSON.stringify(res.data));
      setUser(res.data);
    } catch {
      setUser(DEFAULT_USER);
    }
  }

  function logout() {
    localStorage.removeItem("tj_token");
    localStorage.removeItem("tj_user");
    setUser(DEFAULT_USER);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
