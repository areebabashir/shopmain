import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authLogin, authRegister, authMe, type AuthUser } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setUser(null);
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await authMe(token);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data?.id) {
          setUser(data as AuthUser);
        } else {
          setUser(null);
          localStorage.removeItem("token");
          setTokenState(null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem("token");
          setTokenState(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authLogin(email, password);
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.message === "string" ? data.message : "Login failed");
      const u = data.user as AuthUser;
      setToken(data.token);
      setUser(u);
      return u;
    },
    [setToken]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authRegister(name, email, password);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.message === "string" ? data.message : "Registration failed");
      }
      const u = data.user as AuthUser;
      setToken(data.token);
      setUser(u);
      return u;
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) return;
    const res = await authMe(t);
    const data = await res.json();
    if (res.ok && data?.id) setUser(data as AuthUser);
    else logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
