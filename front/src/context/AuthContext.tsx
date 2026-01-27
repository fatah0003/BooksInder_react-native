import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import { User } from '../types/User';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurer la session au démarrage
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const token = await authService.restoreSession();
      if (token) {
        // TODO: Appeler GET /api/user/me pour récupérer les infos utilisateur
        // Pour l'instant, on considère juste qu'il est connecté
        setUser({ email: 'user', token } as User);
      }
    } catch (error) {
      console.log('Pas de session');
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const token = await authService.login({ email, password });
    setUser({ email, token } as User);
  }


  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
