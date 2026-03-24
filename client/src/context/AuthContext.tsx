import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as logoutApi } from '../services/api';

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

export interface User {
  id: number;
  familyId: number;
  firstName: string;
  lastName: string;
  username: string;
  isParent: boolean;
  balance: number;
}

interface AuthContextValue {
  user: User | null;
  viewingChild: User | null;
  setUser: (u: User | null) => void;
  setViewingChild: (u: User | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [viewingChild, setViewingChild] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => setUser(res.data as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Inactivity timer: logout after 10 minutes with no user interaction
  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setTimeout>;

    function reset() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        setUser(null);
      }, INACTIVITY_MS);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, viewingChild, setUser, setViewingChild, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
