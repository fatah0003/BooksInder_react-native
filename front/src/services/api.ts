import axios from 'axios';
import { Book } from '../types/Book';
import type { Conversation, Message } from '../types/Chat';
import type { Favorite, FavoriteCheckResponse, FavoriteToggleResponse } from '../types/Favorite';
import { API_URL, BASE_URL } from '../config/apiConfig';

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
    console.log('📦 Response complète:', response.data);
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

  // ============================================
// EXCHANGES
// ============================================

// Créer une demande d'échange
createExchange: async (bookOneId: number) => {
  const response = await apiClient.post('/exchanges', {
    bookOneId
  });
  return response.data;
},


// Récupérer les demandes reçues
getReceivedExchanges: async (status?: string, limit: number = 10) => {
  const params: any = { limit };
  if (status) params.status = status;
  
  const response = await apiClient.get('/exchanges/received', { params });
  return response.data;
},

// Récupérer les demandes envoyées
getSentExchanges: async (limit: number = 10) => {
  const params = { limit };
  const response = await apiClient.get('/exchanges/sent', { params });
  return response.data;
},

// Récupérer les échanges complétés
getCompletedExchanges: async (limit: number = 10) => {
  const params = { limit };
  const response = await apiClient.get('/exchanges/completed', { params });
  return response.data;
},

// Détail d'un échange
getExchangeDetail: async (uuid: string) => {
  const response = await apiClient.get(`/exchanges/${uuid}`);
  return response.data;
},

// Livres disponibles du demandeur
getAvailableBooks: async (exchangeUuid: string) => {
  const response = await apiClient.get(`/exchanges/${exchangeUuid}/available-books`);
  return response.data;
},

// Accepter un échange
acceptExchange: async (uuid: string, bookTwoId: number, exchangeType: string) => {
  const response = await apiClient.put(`/exchanges/${uuid}/accept`, {
    bookTwoId,
    exchangeType
  });
  return response.data;
},

// Refuser un échange
rejectExchange: async (uuid: string) => {
  const response = await apiClient.put(`/exchanges/${uuid}/reject`);
  return response.data;
},

// Annuler un échange
cancelExchange: async (uuid: string) => {
  const response = await apiClient.delete(`/exchanges/${uuid}/cancel`);
  return response.data;
},

// ============================================
// NOTIFICATIONS
// ============================================

// Récupérer les notifications
getNotifications: async (limit: number = 20, unread: boolean = false) => {
  const params: any = { limit };
  if (unread) params.unread = true;
  
  const response = await apiClient.get('/notifications', { params });
  return response.data;
},

// Compter les notifications non lues
getUnreadNotificationsCount: async () => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
},

// Marquer une notification comme lue
markNotificationAsRead: async (id: number) => {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data;
},

// Marquer toutes comme lues
markAllNotificationsAsRead: async () => {
  const response = await apiClient.patch('/notifications/mark-all-read');
  return response.data;
},

// Supprimer une notification
deleteNotification: async (id: number) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
},

// Supprimer toutes les notifications lues
clearReadNotifications: async () => {
  const response = await apiClient.delete('/notifications/clear-read');
  return response.data;
},

// ============================================
// CHAT
// ============================================

// Récupère toutes les conversations de l'utilisateur connecté
getConversations: async (): Promise<Conversation[]> => {
  const response = await apiClient.get('/chat/conversations');
  return response.data.data;
},

// Récupère tous les messages d'une conversation spécifique
getConversationMessages: async (conversationId: string): Promise<Message[]> => {
  const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
  return response.data.data;
},

// Envoie un nouveau message dans une conversation
sendMessage: async (conversationId: string, content: string): Promise<Message> => {
  const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
    content: content
  });
  return response.data.data;
},

// Compte le nombre de conversations avec messages non lus
getUnreadConversationsCount: async (): Promise<number> => {
  const response = await apiClient.get('/chat/unread-count');
  return response.data.data.count;
},

// Marque tous les messages d'une conversation comme lus
markConversationAsRead: async (conversationId: string): Promise<void> => {
  await apiClient.post(`/chat/conversations/${conversationId}/mark-read`);
},

  // ============================================
  // FAVORIS
  // ============================================

  // Toggle : ajouter ou retirer un livre des favoris
  toggleFavorite: async (bookId: number): Promise<FavoriteToggleResponse> => {
    const response = await apiClient.patch(`/favorites/toggle/${bookId}`);
    return response.data;
  },

  // Vérifier si un livre est dans les favoris
  checkFavorite: async (bookId: number): Promise<FavoriteCheckResponse> => {
    const response = await apiClient.get(`/favorites/check/${bookId}`);
    return response.data;
  },

  // Récupérer la liste de mes favoris
  getMyFavorites: async (): Promise<Favorite[]> => {
    const response = await apiClient.get('/favorites');
    return response.data.data;
  },
};

export default apiClient;
