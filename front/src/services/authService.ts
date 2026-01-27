import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/User';

export const authService = {
  // Inscription
  register: async (data: RegisterData) => {
    // On n'envoie pas confirmPassword à l'API (juste pour validation front)
    const { confirmPassword, ...registerPayload } = data;
    
    const response = await apiClient.post('/register', registerPayload);
    return response.data;  // Retourne l'user créé
  },

  // Connexion
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/login', credentials);
    const { token } = response.data;
    
    // Sauvegarder le token sur le téléphone
    await AsyncStorage.setItem('token', token);
    
    // Configurer axios pour les prochaines requêtes
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return token;
  },

  // Déconnexion
  logout: async () => {
    await AsyncStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  },

  // Récupérer le token stocké (au démarrage de l'app)
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
  },

  // Restaurer la session au démarrage
  restoreSession: async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  },
};
