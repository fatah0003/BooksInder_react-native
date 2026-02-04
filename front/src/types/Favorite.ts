// favori
export interface Favorite {
  id: number;
  createdAt: string;
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    bookStatus: string;
    owner: {
      id: number;
    };
  };
}

// vérifier si un livre est favori
export interface FavoriteCheckResponse {
  success: boolean;
  isFavorite: boolean;
  favoriteId: number | null;
}

//API pour toggle
export interface FavoriteToggleResponse {
  success: boolean;
  action: 'added' | 'removed';
  message: string;
  isFavorite: boolean;
  favoriteId?: number;
}
