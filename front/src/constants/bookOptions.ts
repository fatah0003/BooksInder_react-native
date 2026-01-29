import { BookCategorie, BookState, ExchangeType } from '../services/bookService';

export const BOOK_CATEGORIES: { value: BookCategorie; label: string }[] = [
  { value: 'philosophy', label: 'Philosophie' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'Historical', label: 'Historique' },
  { value: 'science_fiction', label: 'Science-fiction' },
];

export const BOOK_STATES: { value: BookState; label: string }[] = [
  { value: 'new', label: 'Neuf' },
  { value: 'like_new', label: 'Comme neuf' },
  { value: 'very_good', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'acceptable', label: 'État acceptable' },
  { value: 'well_loved', label: 'Bien vécu' },
];

export const EXCHANGE_TYPES: { value: ExchangeType; label: string }[] = [
  { value: 'temporary', label: 'Échange temporaire' },
  { value: 'permanent', label: 'Échange permanent' },
];
