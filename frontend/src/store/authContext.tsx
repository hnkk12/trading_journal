import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { User } from "../types";

interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (profile: GoogleProfile) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      if (urlToken) {
        window.history.replaceState({}, "", window.location.pathname);
        try {
          await loginWithToken(urlToken);
        } catch {
          // ignore, falls through to normal check below
        }
        setLoading(false);
        return;
      }

      const cachedToken = localStorage.getItem("tj_token");
      if (cachedToken) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
          localStorage.setItem("tj_user", JSON.stringify(res.data));
        } catch {
          localStorage.removeItem("tj_token");
          localStorage.removeItem("tj_user");
          setUser(null);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function loginWithToken(token: string) {
    localStorage.setItem("tj_token", token);
    const res = await api.get("/auth/me");
    localStorage.setItem("tj_user", JSON.stringify(res.data));
    setUser(res.data);
  }

  async function loginWithGoogle(profile: GoogleProfile) {
    const res = await api.post("/auth/google", profile);
    localStorage.setItem("tj_token", res.data.token);
    localStorage.setItem("tj_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  }

  function logout() {
    localStorage.removeItem("tj_token");
    localStorage.removeItem("tj_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
