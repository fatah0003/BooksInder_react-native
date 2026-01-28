import apiClient from './api';
import { InfosUser } from '../types/User';

export interface CreateInfosUserData {
  userName: string;
  phoneNumber: string;
  city: string;
  birthDate: string; // Format: YYYY-MM-DD
  bio?: string;
}

export interface UpdateInfosUserData {
  userName?: string;
  phoneNumber?: string;
  city?: string;
  birthDate?: string;
  bio?: string;
}

export const infosUserService = {
  // Créer les infos utilisateur
  create: async (data: CreateInfosUserData): Promise<InfosUser> => {
    const response = await apiClient.post('/infosusers', data);
    return response.data;
  },

  // Modifier les infos utilisateur
  update: async (id: number, data: UpdateInfosUserData): Promise<InfosUser> => {
    const response = await apiClient.put(`/infosusers/${id}`, data);
    return response.data;
  },

  // Récupérer les infos utilisateur
  get: async (id: number): Promise<InfosUser> => {
    const response = await apiClient.get(`/infosusers/${id}`);
    return response.data;
  },
};
