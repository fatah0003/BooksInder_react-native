const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

export interface GoogleBookInfo {
  title: string | null;
  author: string | null;
  description: string | null;
  pages: number | null;
  publisher: string | null;
  publishedDate: string | null;
  categories: string[];
  thumbnail: string | null;
}

export const googleBooksService = {
  searchByIsbn: async (isbn: string): Promise<GoogleBookInfo | null> => {
    try {
      // Nettoyer l'ISBN (enlever tirets et espaces)
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Appel direct à l'API Google
      const response = await fetch(`${GOOGLE_BOOKS_API}?q=isbn:${cleanIsbn}`);
      
      if (!response.ok) {
        console.warn('Erreur API Google Books:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      // Vérifier qu'on a des résultats
      if (!data.items || data.items.length === 0) {
        console.log('Aucun livre trouvé pour ISBN:', isbn);
        return null;
      }
      
      const volumeInfo = data.items[0].volumeInfo;
      
      // Formater les données
      return {
        title: volumeInfo.title || null,
        author: volumeInfo.authors ? volumeInfo.authors.join(', ') : null,
        description: volumeInfo.description || null,
        pages: volumeInfo.pageCount || null,
        publisher: volumeInfo.publisher || null,
        publishedDate: volumeInfo.publishedDate || null,
        categories: volumeInfo.categories || [],
        thumbnail: volumeInfo.imageLinks?.thumbnail || null,
      };
      
    } catch (error: any) {
      console.warn('Erreur recherche Google Books:', error.message);
      return null;
    }
  },
};
