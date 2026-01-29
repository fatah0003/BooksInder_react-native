import axios from 'axios';
import { Book } from '../types/Book';

const API_URL = 'http://192.168.1.115:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  // Récupérer tous les livres
  getBooks: async () => {
    const response = await apiClient.get('/books');
    return response.data.data;
  },
  
  // Récupérer les détails d'un livre (nécessite authentification)
getBookDetail: async (uuid: string): Promise<Book> => {
  const response = await apiClient.get(`/books/${uuid}`);
  console.log('📦 Response complète:', response.data);
  return response.data.data || response.data; // Essaie .data.data en priorité
},
};

export default apiClient;
