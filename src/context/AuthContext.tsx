import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserMode = 'guest' | 'logged_in' | 'admin' | 'empleado' | null;

interface AuthContextType {
  token: string | null;
  role: UserMode;
  email: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (token: string, rol: string, email: string) => void;
  logout: () => void;
  enterGuest: () => void;
  sede: string;
  updateSede: (sede: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [role, setRole] = useState<UserMode>(() => {
    const saved = localStorage.getItem('userMode');
    return (saved as UserMode) || null;
  });
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('userEmail'));
  const [sede, setSede] = useState<string>(() => localStorage.getItem('sede') || 'barranco');

  const isAuthenticated = !!token && role !== 'guest';
  const isGuest = role === 'guest';

  const login = (newToken: string, rol: string, userEmail: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', userEmail);
    let mode: UserMode = 'logged_in';
    if (rol === 'admin') mode = 'admin';
    else if (rol === 'empleado') mode = 'empleado';
    else mode = 'logged_in';
    localStorage.setItem('userMode', mode);
    setToken(newToken);
    setRole(mode);
    setEmail(userEmail);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userMode');
    localStorage.removeItem('userEmail');
    setToken(null);
    setRole(null);
    setEmail(null);
  };

  const enterGuest = () => {
    localStorage.removeItem('token');
    localStorage.setItem('userMode', 'guest');
    setToken(null);
    setRole('guest');
  };

  const updateSede = (newSede: string) => {
    localStorage.setItem('sede', newSede);
    setSede(newSede);
  };

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('token'));
      setRole((localStorage.getItem('userMode') as UserMode) || null);
      setEmail(localStorage.getItem('userEmail'));
      setSede(localStorage.getItem('sede') || 'barranco');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, email, isAuthenticated, isGuest, login, logout, enterGuest, sede, updateSede }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
