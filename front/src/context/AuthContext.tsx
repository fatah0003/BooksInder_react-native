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
    const restoredUser = await authService.restoreSession();
    if (restoredUser) {
      setUser(restoredUser);
    }
  } catch (error) {
    console.log('Pas de session');
  } finally {
    setLoading(false);
  }
}



  async function login(email: string, password: string) {
    const response = await authService.login({ email, password });
    
    // ⬇️ CHANGÉ : On récupère les données complètes depuis la réponse
    const token = typeof response === 'string' ? response : response.token;
    const userEmail = typeof response === 'string' ? email : response.email;
    const uuid = typeof response === 'string' ? '' : response.uuid;
    const roles = typeof response === 'string' ? ['ROLE_USER'] : response.roles;
    
    setUser({ 
      email: userEmail, 
      token,
      uuid,
      roles
    } as User);
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
