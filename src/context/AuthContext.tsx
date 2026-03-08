import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'salle' | 'serveur' | 'caissier' | 'livreur' | 'comptable';
  tenant?: {
    id: string;
    name: string;
    slug: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    features?: any;
    branding?: any;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gotchop_token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('gotchop_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('gotchop_token', token);
    setUser(userData);
  };

  const logout = () => {
    api.post('/auth/logout').finally(() => {
      // Clean up all gotchop keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gotchop_')) {
          localStorage.removeItem(key);
        }
      });
      setUser(null);
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
