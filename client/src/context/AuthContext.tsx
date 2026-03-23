import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

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
