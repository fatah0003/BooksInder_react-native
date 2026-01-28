import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/User';

export const authService = {
  // Récupérer l'utilisateur connecté depuis l'API
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  // Inscription
  register: async (data: RegisterData) => {
    const { confirmPassword, ...registerPayload } = data;
    
    const response = await apiClient.post('/register', registerPayload);
    const { token } = response.data;
    
    await AsyncStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Récupérer les infos complètes de l'utilisateur
    const user = await authService.getCurrentUser();
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },

  // Connexion
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/login', credentials);
    const { token } = response.data;
    
    await AsyncStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Récupérer les infos complètes de l'utilisateur
    const user = await authService.getCurrentUser();
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  },

  // Déconnexion
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  // Récupérer le token stocké (au démarrage de l'app)
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
  },

  // Restaurer la session au démarrage
  restoreSession: async (): Promise<User | null> => {
    const token = await AsyncStorage.getItem('token');
    const userJson = await AsyncStorage.getItem('user');
    
    if (token && userJson) {
      const userData = JSON.parse(userJson);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return {
        ...userData,
        token,
      };
    }
    
    return null;
  },
};
