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

export interface BooksResponse {
  data: Book[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

export const api = {
  // Récupérer tous les livres avec pagination
  getBooks: async (page: number = 1, limit: number = 10): Promise<BooksResponse> => {
    const response = await apiClient.get(`/books?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // Récupérer les détails d'un livre
  getBookDetail: async (uuid: string): Promise<Book> => {
    const response = await apiClient.get(`/books/${uuid}`);
    console.log('Response complète:', response.data);
    return response.data.data || response.data;
  },

  // Récupérer le profil public d'un utilisateur + ses livres
  getUserPublicProfile: async (userUuid: string) => {
    const response = await apiClient.get(`/users/${userUuid}/public-profile`);
    return response.data.data;
  },

  // Récupérer MES livres
  getMyBooks: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books/my-books');
    return response.data.data;
  },
};

export default apiClient;
