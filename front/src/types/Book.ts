// Structure d'une image de livre
export interface BookImage {
  id: number;
  type: 'front' | 'back';
  imageName: string;
  imageUrl: string;
  createdAt: string;
}

// Structure du propriétaire du livre
export interface BookOwner {
  uuid: string;
  infosUser?: {
    userName: string;
  };
}

// Structure d'un livre
export interface Book {
  id: number;
  uuid: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  pages: number;
  createdAt: string;
  updatedAt: string;
  edition: string;
  location: string;
  categorie: string[];
  state: 'new' | 'like_new' | 'good' | 'acceptable';
  bookStatus: string;
  availableExchangeTypes: string[];
  images: BookImage[];
  user?: BookOwner;
}
