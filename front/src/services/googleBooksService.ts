const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

const GOOGLE_API_KEY = 'AIzaSyBHRj6iUtXolHGErB6P2kWAGZKEvaNN-Zk';


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

// Fonction helper pour attendre (gestion du rate limiting)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const googleBooksService = {
  searchByIsbn: async (isbn: string, retries = 2): Promise<GoogleBookInfo | null> => {
    try {
      // Nettoyer l'ISBN (enlever tirets et espaces)
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Construire l'URL avec ou sans clé API
      const url = GOOGLE_API_KEY 
        ? `${GOOGLE_BOOKS_API}?q=isbn:${cleanIsbn}&key=${GOOGLE_API_KEY}`
        : `${GOOGLE_BOOKS_API}?q=isbn:${cleanIsbn}`;
      
      // Appel à l'API Google
      const response = await fetch(url);
      
      // ✅ GESTION SPÉCIFIQUE DU 429 (Too Many Requests)
      if (response.status === 429) {
        console.warn('⚠️ Erreur 429: Limite de requêtes atteinte');
        
        if (retries > 0) {
          const waitTime = (3 - retries) * 2000; // 2s, puis 4s
          console.log(`⏳ Réessai dans ${waitTime / 1000} secondes...`);
          await sleep(waitTime);
          return googleBooksService.searchByIsbn(isbn, retries - 1);
        }
        
        // Si plus de retries, retourner null
        console.warn('❌ Impossible de contacter l\'API après plusieurs tentatives');
        return null;
      }
      
      if (!response.ok) {
        console.warn('Erreur API Google Books:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      // Vérifier qu'on a des résultats
      if (!data.items || data.items.length === 0) {
        console.log('Aucun livre trouvé pour ISBN:', cleanIsbn);
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
