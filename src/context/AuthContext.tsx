import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserMode = 'guest' | 'logged_in' | 'admin' | 'empleado' | null;

interface AuthContextType {
  token: string | null;
  role: UserMode;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (token: string, rol: string) => void;
  logout: () => void;
  enterGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRole] = useState<UserMode>(() => {
    const saved = localStorage.getItem('userMode');
    return (saved as UserMode) || null;
  });

  const isAuthenticated = !!token && role !== 'guest';
  const isGuest = role === 'guest';

  const login = (newToken: string, rol: string) => {
    localStorage.setItem('token', newToken);
    let mode: UserMode = 'logged_in';
    if (rol === 'admin') mode = 'admin';
    else if (rol === 'empleado') mode = 'empleado';
    else mode = 'logged_in';
    localStorage.setItem('userMode', mode);
    setToken(newToken);
    setRole(mode);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userMode');
    setToken(null);
    setRole(null);
  };

  const enterGuest = () => {
    localStorage.removeItem('token');
    localStorage.setItem('userMode', 'guest');
    setToken(null);
    setRole('guest');
  };

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('token'));
      setRole((localStorage.getItem('userMode') as UserMode) || null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, isAuthenticated, isGuest, login, logout, enterGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
