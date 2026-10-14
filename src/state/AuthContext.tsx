import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppData } from '../types';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, password: string, displayName?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  uploadAvatar: (file: File) => Promise<{ ok: boolean; avatarUrl?: string; error?: string }>;
  updateDisplayName: (displayName: string) => Promise<{ ok: boolean; error?: string }>;
  continueAsGuest: () => void;
  deleteAccount: (password: string, confirmPassword: string) => Promise<{ ok: boolean; error?: string }>;
  saveDataToServer: (data: AppData) => Promise<boolean>;
  loadDataFromServer: () => Promise<AppData | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'devamsizlik-auth-token';
const GUEST_KEY = 'devamsizlik-guest-mode';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing session on mount
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const body = await res.json();
          setUser(body.user);
          setIsGuest(false);
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session verify error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || 'Giriş yapılamadı.' };
      }

      localStorage.setItem(TOKEN_KEY, body.token);
      localStorage.removeItem(GUEST_KEY);
      setToken(body.token);
      setUser(body.user);
      setIsGuest(false);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sunucuya bağlanılamadı.' };
    }
  };

  const register = async (username: string, password: string, displayName?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, displayName }),
      });

      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || 'Kayıt yapılamadı.' };
      }

      localStorage.setItem(TOKEN_KEY, body.token);
      localStorage.removeItem(GUEST_KEY);
      setToken(body.token);
      setUser(body.user);
      setIsGuest(false);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sunucuya bağlanılamadı.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsGuest(false);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
  };

  const uploadAvatar = async (file: File) => {
    if (!token) return { ok: false, error: 'Oturum açık değil.' };

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || 'Resim yüklenemedi.' };
      }

      setUser((prev) => (prev ? { ...prev, avatarUrl: body.avatarUrl } : null));
      return { ok: true, avatarUrl: body.avatarUrl };
    } catch {
      return { ok: false, error: 'Sunucuya yüklenirken hata oluştu.' };
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!token) return { ok: false, error: 'Oturum açık değil.' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName }),
      });

      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || 'Profil güncellenemedi.' };
      }

      setUser((prev) => (prev ? { ...prev, displayName: body.displayName } : null));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sunucuya bağlanılamadı.' };
    }
  };

  const deleteAccount = async (password: string, confirmPassword: string) => {
    if (!token) return { ok: false, error: 'Oturum açık değil.' };

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const body = await res.json();
      if (!res.ok) {
        return { ok: false, error: body.error || 'Hesap silinemedi.' };
      }

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(GUEST_KEY);
      setToken(null);
      setUser(null);
      setIsGuest(false);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sunucuya bağlanılamadı.' };
    }
  };

  const saveDataToServer = async (data: AppData): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const loadDataFromServer = async (): Promise<AppData | null> => {
    if (!token) return null;
    try {
      const res = await fetch('/api/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isGuest,
        isLoading,
        login,
        register,
        logout,
        uploadAvatar,
        updateDisplayName,
        continueAsGuest,
        deleteAccount,
        saveDataToServer,
        loadDataFromServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
