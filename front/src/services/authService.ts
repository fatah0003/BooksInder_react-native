import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/User';

export const authService = {
  // Inscription
  register: async (data: RegisterData) => {
    const { confirmPassword, ...registerPayload } = data;
    
    const response = await apiClient.post('/register', registerPayload);
    const { token, email, uuid, roles } = response.data;
    
    // ⬇️ AJOUT : Sauvegarder les données utilisateur
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify({ email, uuid, roles }));
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return response.data;
  },

  // Connexion
login: async (credentials: LoginCredentials) => {
  const response = await apiClient.post('/login', credentials);
  const { token } = response.data;
  
  const email = response.data.email || credentials.email;
  const uuid = response.data.uuid || '';
  const roles = response.data.roles || ['ROLE_USER'];
  
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify({ email, uuid, roles }));
  
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return token;
},


  // Déconnexion
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user'); // ⬅️ AJOUT
    delete apiClient.defaults.headers.common['Authorization'];
  },

  // Récupérer le token stocké (au démarrage de l'app)
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('token');
  },

  // ⬇️ MODIFIÉ : Restaurer la session avec les données utilisateur
  restoreSession: async (): Promise<User | null> => {
    const token = await AsyncStorage.getItem('token');
    const userJson = await AsyncStorage.getItem('user');
    
    if (token && userJson) {
      const userData = JSON.parse(userJson);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Retourner l'objet User complet
      return {
        ...userData,
        token,
      };
    }
    
    return null;
  },
};
