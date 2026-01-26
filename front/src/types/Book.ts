// Structure d'une image de livre
export interface BookImage {
  id: number;
  type: 'front' | 'back';
  imageName: string;
  imageUrl: string;
  createdAt: string;
}

// Structure d'un livre
export interface Book {
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
}
