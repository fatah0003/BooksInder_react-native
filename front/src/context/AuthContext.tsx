import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { User } from '../types/User';
import { setTokenExpiredCallback } from '../services/api';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
    
    // Enregistrer le callback de déconnexion automatique
    setTokenExpiredCallback(() => {
      console.log('Callback déconnexion appelé depuis l\'intercepteur');
      setUser(null);
    });
  }, []);

  async function loadStoredData() {
    try {
      const restoredUser = await authService.restoreSession();
      
      if (restoredUser) {
        try {
          console.log('Vérification de la validité du token...');
          const validUser = await authService.getCurrentUser();
          setUser(validUser);
          console.log(' Token valide, session restaurée');
        } catch (error: any) {
          console.log('Token expiré au démarrage, déconnexion');
          await authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.log('Erreur lors de la restauration de session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await authService.login({ email, password });
    setUser(response.user);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const updatedUser = await authService.getCurrentUser();
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Token expiré lors du refresh');
        await logout();
      } else {
        console.log('Erreur refresh user:', error);
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
