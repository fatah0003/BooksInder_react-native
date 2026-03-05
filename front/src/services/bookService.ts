import apiClient from './api';
import { Book } from '../types/Book';

// Énumérations
export type BookCategorie = 'philosophy' | 'fiction' | 'Historical' | 'science_fiction';
export type ExchangeType = 'temporary' | 'permanent';
export type BookState = 'new' | 'like_new' | 'very_good' | 'good' | 'acceptable' | 'well_loved';

export interface CreateBookData {
  title: string;
  author: string;
  isbn: string;
  description: string;
  pages: number;
  edition?: string;
  location: string;
  categorie: BookCategorie[];
  state: BookState;
  availableExchangeTypes: ExchangeType[];
}

export interface UpdateBookData {
  title?: string;
  author?: string;
  isbn?: string;
  description?: string;
  pages?: number;
  edition?: string;
  location?: string;
  categorie?: BookCategorie[];
  state?: BookState;
  availableExchangeTypes?: ExchangeType[];
}

export const bookService = {
  // Étape 1 : Créer le livre (JSON)
  create: async (bookData: CreateBookData): Promise<Book> => {
    const response = await apiClient.post('/books', bookData);
    return response.data.data || response.data;
  },

   // Modifier le livre
  update: async (bookUuid: string, bookData: UpdateBookData): Promise<Book> => {
    const response = await apiClient.put(`/books/${bookUuid}`, bookData);
    return response.data.data || response.data;
  },

  // Supprimer le livre
  delete: async (bookUuid: string): Promise<void> => {
    await apiClient.delete(`/books/${bookUuid}`);
  },

  // Étape 2 : Upload image front
  uploadCoverFront: async (bookUuid: string, imageUri: string): Promise<void> => {
    const formData = new FormData();
    
    const imageFile: any = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'front.jpg',
    };
    
    formData.append('file', imageFile);

    await apiClient.post(`/books/${bookUuid}/cover-front`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Étape 3 : Upload image back
  uploadCoverBack: async (bookUuid: string, imageUri: string): Promise<void> => {
    const formData = new FormData();
    
    const imageFile: any = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'back.jpg',
    };
    
    formData.append('file', imageFile);

    await apiClient.post(`/books/${bookUuid}/cover-back`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
