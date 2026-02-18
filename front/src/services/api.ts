import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../types/Book';
import type { Conversation, Message } from '../types/Chat';
import type { Favorite, FavoriteCheckResponse, FavoriteToggleResponse } from '../types/Favorite';
import { API_URL } from '../config/apiConfig';
import { User } from '../types/User';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 40000,
});

// Fonction pour vérifier si une route est publique
const isPublicRoute = (url?: string, method?: string): boolean => {
  if (!url) return false;
  
  const publicPatterns = [
    /^\/login$/,
    /^\/register$/,
    /^\/password\/reset-request$/,
    /^\/password\/reset-confirm$/,
  ];

  // GET /api/books est public
  if (method === 'GET' && (/^\/books$/.test(url) || /^\/books\?/.test(url) || /^\/books\/[a-f0-9-]+$/.test(url))) {
    return true;
  }
  
  return publicPatterns.some(pattern => pattern.test(url));
};

// Callback pour déconnexion (sera défini par AuthContext)
let onTokenExpired: (() => void) | null = null;

export const setTokenExpiredCallback = (callback: () => void) => {
  onTokenExpired = callback;
};

// Intercepteur REQUEST : Ajouter le token
apiClient.interceptors.request.use(
  async (config) => {
    const method = config.method?.toUpperCase();
    
    if (!isPublicRoute(config.url, method)) {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token ajouté pour:', config.url);
      }
    } else {
      console.log('🌐 Route publique (pas de token):', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur RESPONSE : Gérer les erreurs 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Cas spécial : erreur de mot de passe lors de la suppression de compte
    const isDeleteAccountPasswordError = 
      error.config?.url?.includes('/users/') && 
      error.config?.method === 'delete' &&
      error.response?.status === 401;
    
    // Si c'est une erreur 401 MAIS PAS une erreur de mot de passe
    if (error.response?.status === 401 && !isDeleteAccountPasswordError) {
      console.log('Token expiré détecté (401), nettoyage des données locales');
      
      // Supprimer les données locales
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
      
      // Déclencher la déconnexion dans AuthContext
      if (onTokenExpired) {
        console.log('Déconnexion automatique déclenchée');
        onTokenExpired();
      }
    }
    
    return Promise.reject(error);
  }
);

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

export interface BookFilters {
  search?: string;
  location?: string;
  category?: string;
  availableExchangeType?: string;
  state?: string;
}

export const api = {
  // livres pagination + filtres
  getBooks: async (page: number = 1, limit: number = 10, filters?: BookFilters): Promise<BooksResponse> => {
    const params: any = { page, limit };
    
    if (filters?.search) params.search = filters.search;
    if (filters?.location) params.location = filters.location;
    if (filters?.category) params.category = filters.category;
    if (filters?.availableExchangeType) params.availableExchangeType = filters.availableExchangeType;
    if (filters?.state) params.state = filters.state;

    const response = await apiClient.get('/books', { params });
    return response.data;
  },
  
  // détails livre
  getBookDetail: async (uuid: string): Promise<Book> => {
    const response = await apiClient.get(`/books/${uuid}`);
    return response.data.data || response.data;
  },

  // profil public utilisateur + ses livres
  getUserPublicProfile: async (userUuid: string) => {
    const response = await apiClient.get(`/users/${userUuid}/public-profile`);
    return response.data.data;
  },

  // mes livres
  getMyBooks: async (): Promise<Book[]> => {
    const response = await apiClient.get('/books/my-books');
    return response.data.data;
  },

  // EXCHANGES
  createExchange: async (bookOneId: number) => {
    const response = await apiClient.post('/exchanges', { bookOneId });
    return response.data;
  },

  getReceivedExchanges: async (status?: string, limit: number = 10) => {
    const params: any = { limit };
    if (status) params.status = status;
    const response = await apiClient.get('/exchanges/received', { params });
    return response.data;
  },

  getSentExchanges: async (limit: number = 10) => {
    const params = { limit };
    const response = await apiClient.get('/exchanges/sent', { params });
    return response.data;
  },

  getCompletedExchanges: async (limit: number = 10) => {
    const params = { limit };
    const response = await apiClient.get('/exchanges/completed', { params });
    return response.data;
  },

  getExchangeDetail: async (uuid: string) => {
    const response = await apiClient.get(`/exchanges/${uuid}`);
    return response.data;
  },

  getAvailableBooks: async (exchangeUuid: string) => {
    const response = await apiClient.get(`/exchanges/${exchangeUuid}/available-books`);
    return response.data;
  },

  acceptExchange: async (uuid: string, bookTwoId: number, exchangeType: string) => {
    const response = await apiClient.put(`/exchanges/${uuid}/accept`, {
      bookTwoId,
      exchangeType
    });
    return response.data;
  },

  rejectExchange: async (uuid: string) => {
    const response = await apiClient.put(`/exchanges/${uuid}/reject`);
    return response.data;
  },

  cancelExchange: async (uuid: string) => {
    const response = await apiClient.delete(`/exchanges/${uuid}/cancel`);
    return response.data;
  },

  // NOTIFICATIONS
  getNotifications: async (limit: number = 20, unread: boolean = false) => {
    const params: any = { limit };
    if (unread) params.unread = true;
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  getUnreadNotificationsCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  markNotificationAsRead: async (id: number) => {
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: number) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  clearReadNotifications: async () => {
    const response = await apiClient.delete('/notifications/clear-read');
    return response.data;
  },

  // CHAT
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/chat/conversations');
    return response.data.data;
  },

  getConversationMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    return response.data.data;
  },

  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
      content: content
    });
    return response.data.data;
  },

  getUnreadConversationsCount: async (): Promise<number> => {
    const response = await apiClient.get('/chat/unread-count');
    return response.data.data.count;
  },

  markConversationAsRead: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/chat/conversations/${conversationId}/mark-read`);
  },

  // FAVORIS
  toggleFavorite: async (bookId: number): Promise<FavoriteToggleResponse> => {
    const response = await apiClient.patch(`/favorites/toggle/${bookId}`);
    return response.data;
  },

  checkFavorite: async (bookId: number): Promise<FavoriteCheckResponse> => {
    const response = await apiClient.get(`/favorites/check/${bookId}`);
    return response.data;
  },

  getMyFavorites: async (): Promise<Favorite[]> => {
    const response = await apiClient.get('/favorites');
    return response.data.data;
  },

  // ADMIN - Users
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  deleteUser: async (uuid: string) => {
    const response = await apiClient.delete(`/users/${uuid}`);
    return response.data;
  },

  // ADMIN - Books
  deleteBook: async (uuid: string) => {
    const response = await apiClient.delete(`/books/${uuid}`);
    return response.data;
  },
};

export default apiClient;
