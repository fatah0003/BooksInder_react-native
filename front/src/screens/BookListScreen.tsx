import React, { useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView, Modal } from 'react-native';
import { api, BookFilters } from '../services/api';
import { Book } from '../types/Book';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, BASE_URL } from '../config/apiConfig';

// Listes des options pour les filtres
const CATEGORIES = [
  { label: 'Fiction', value: 'fiction' },
  { label: 'Science Fiction', value: 'science_fiction' },
  { label: 'Philosophie', value: 'philosophy' },
  { label: 'Histoire', value: 'Historical' },
];

const EXCHANGE_TYPES = [
  { label: 'Échange temporaire', value: 'temporary' },
  { label: 'Échange permanent', value: 'permanent' },
];

const STATES = [
  { label: 'Neuf', value: 'new' },
  { label: 'Comme neuf', value: 'like_new' },
  { label: 'Très bon état', value: 'very_good' },
  { label: 'Bon état', value: 'good' },
  { label: 'État acceptable', value: 'acceptable' },
];

type FilterType = 'location' | 'category' | 'exchange' | 'state';

export default function BookListScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BookFilters>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<FilterType | null>(null);
  const [tempLocationInput, setTempLocationInput] = useState('');

  const isLoadingRef = useRef(false);

  const { user } = useAuth();
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      resetAndLoad();
    }, [])
  );

  const resetAndLoad = () => {
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, filters);
  };

  const loadBooks = async (page: number = 1, refresh: boolean = false, currentFilters: BookFilters = {}) => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;

    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.getBooks(page, 10, currentFilters);

      if (refresh) {
        setBooks(response.data);
      } else {
        setBooks((prevBooks) => [...prevBooks, ...response.data]);
      }

      setHasNextPage(response.pagination.hasNextPage);
      setCurrentPage(page);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const handleSearchSubmit = () => {
    const newFilters = { ...filters };
    if (searchQuery.trim()) {
      newFilters.search = searchQuery.trim();
    } else {
      delete newFilters.search;
    }

    setFilters(newFilters);
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, newFilters);
  };

  const handleLoadMore = () => {
    if (isLoadingRef.current || !hasNextPage) {
      return;
    }

    const nextPage = currentPage + 1;
    loadBooks(nextPage, false, filters);
  };

  const handleBookPress = (book: Book) => {
    if (user) {
      navigation.navigate('BookDetail' as never, { bookUuid: book.uuid } as never);
    } else {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour consulter les détails d\'un livre.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Profil' as never)
          }
        ]
      );
    }
  };

  const handleAddBook = () => {
    if (user) {
      navigation.navigate('AddBook' as never);
    } else {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter un livre.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Profil' as never)
          }
        ]
      );
    }
  };

  const openFilterModal = (filterType: FilterType) => {
    setActiveFilterType(filterType);
    setTempLocationInput('');
    setModalVisible(true);
  };

  const applyFilter = (filterType: string, value: string) => {
    const newFilters = { ...filters };

    if (filterType === 'location') {
      newFilters.location = value;
    } else if (filterType === 'category') {
      newFilters.category = value;
    } else if (filterType === 'exchange') {
      newFilters.availableExchangeType = value;
    } else if (filterType === 'state') {
      newFilters.state = value;
    }

    setFilters(newFilters);
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, newFilters);
    setModalVisible(false);
  };

  const removeFilter = (filterKey: keyof BookFilters) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];

    if (filterKey === 'search') {
      setSearchQuery('');
    }

    setFilters(newFilters);
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, newFilters);
  };

  // Fonction pour tout réinitialiser
  const resetAllFilters = () => {
    console.log('🔄 Réinitialisation totale des filtres');
    setSearchQuery('');
    setFilters({});
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, {});
  };

  const renderModalContent = () => {
    if (activeFilterType === 'location') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir une ville</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Entrez une ville..."
            value={tempLocationInput}
            onChangeText={setTempLocationInput}
            autoFocus
          />
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => tempLocationInput && applyFilter('location', tempLocationInput)}
          >
            <Text style={styles.applyButtonText}>Appliquer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeFilterType === 'category') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir une catégorie</Text>
          <ScrollView style={styles.optionsList}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={styles.filterOption}
                onPress={() => applyFilter('category', cat.value)}
              >
                <Text style={styles.filterOptionText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeFilterType === 'exchange') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Type d'échange</Text>
          {EXCHANGE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={styles.filterOption}
              onPress={() => applyFilter('exchange', type.value)}
            >
              <Text style={styles.filterOptionText}>{type.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeFilterType === 'state') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>État du livre</Text>
          <ScrollView style={styles.optionsList}>
            {STATES.map((state) => (
              <TouchableOpacity
                key={state.value}
                style={styles.filterOption}
                onPress={() => applyFilter('state', state.value)}
              >
                <Text style={styles.filterOptionText}>{state.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Chargement des livres...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur : {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={resetAndLoad}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <View style={styles.container}>
      {/* Header avec logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoBook}>Books</Text>
          <Text style={styles.logoInsider}>Inder</Text>
        </Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Chercher un livre par titre, auteur"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.micIcon}>
            <Ionicons name="mic" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topFiltersContainer}
        contentContainerStyle={styles.topFiltersContent}
      >
        <TouchableOpacity
          style={[styles.topFilterChip, filters.location && styles.topFilterChipActive]}
          onPress={() => openFilterModal('location')}
        >
          <Text style={[styles.topFilterText, filters.location && styles.topFilterTextActive]}>
            Ville
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topFilterChip, filters.category && styles.topFilterChipActive]}
          onPress={() => openFilterModal('category')}
        >
          <Text style={[styles.topFilterText, filters.category && styles.topFilterTextActive]}>
            Catégorie
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topFilterChip, filters.availableExchangeType && styles.topFilterChipActive]}
          onPress={() => openFilterModal('exchange')}
        >
          <Text style={[styles.topFilterText, filters.availableExchangeType && styles.topFilterTextActive]}>
            Type d'échange
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topFilterChip, filters.state && styles.topFilterChipActive]}
          onPress={() => openFilterModal('state')}
        >
          <Text style={[styles.topFilterText, filters.state && styles.topFilterTextActive]}>
            État
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* filtres actifs*/}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersScroll}
          >
            {filters.search && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => removeFilter('search')}
              >
                <Text style={styles.activeFilterText}>🔍 {filters.search}</Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.location && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => removeFilter('location')}
              >
                <Text style={styles.activeFilterText}>📍 {filters.location}</Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.category && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => removeFilter('category')}
              >
                <Text style={styles.activeFilterText}>
                  📚 {CATEGORIES.find(c => c.value === filters.category)?.label}
                </Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.availableExchangeType && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => removeFilter('availableExchangeType')}
              >
                <Text style={styles.activeFilterText}>
                  🔄 {EXCHANGE_TYPES.find(e => e.value === filters.availableExchangeType)?.label}
                </Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.state && (
              <TouchableOpacity
                style={styles.activeFilterChip}
                onPress={() => removeFilter('state')}
              >
                <Text style={styles.activeFilterText}>
                  🏷️ {STATES.find(s => s.value === filters.state)?.label}
                </Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Bouton Effacer */}
          <TouchableOpacity onPress={resetAllFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grille des livres */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.uuid}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const frontImage = item.images.find(img => img.type === 'front');
          const imageToShow = frontImage || item.images[0];

          return (
            <TouchableOpacity
              style={styles.bookCard}
              onPress={() => handleBookPress(item)}
            >
              {imageToShow ? (
                <Image
                  source={{ uri: `${BASE_URL}${imageToShow.imageUrl}` }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="book-outline" size={56} color="#47769d" />
                  </View>
                </View>

              )}
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.bookFooter}>
                  <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                  <Text style={styles.bookLocation}>{item.location}</Text>
                </View>
              </View>

            </TouchableOpacity>
          );
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#4CAF50" />
              </View>
            );
          }

          if (!hasNextPage && books.length > 0) {
            return (
              <View style={styles.endMessage}>
                <Ionicons name="sparkles-outline" size={22} color="#47769d" />
                <Text style={styles.endMessageText}>Vous avez tout vu</Text>
              </View>

            );
          }

          if (books.length === 0 && !loading) {
            return (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun livre trouvé</Text>
                <Text style={styles.emptySubtext}>Essayez de modifier vos filtres</Text>
              </View>
            );
          }

          return null;
        }}
      />

      {user && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddBook}>
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal pour les filtres */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Header avec logo
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoBook: {
    color: '#81C784', // Vert clair
  },
  logoInsider: {
    color: '#388E3C', // Vert foncé
  },

  // Barre de recherche
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  micIcon: {
    padding: 5,
  },
  micIconText: {
    fontSize: 20,
  },

  // Filtres horizontaux 
  topFiltersContainer: {
    height: 50,
    marginBottom: 15,
  },
  topFiltersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  topFilterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  topFilterChipActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  topFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  topFilterTextActive: {
    color: '#388E3C',
    fontWeight: '600',
  },

  // Filtres actifs (chips)
  activeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  activeFiltersScroll: {
    flex: 1,
  },
  activeFilterChip: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  removeFilterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Grille de livres
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  bookCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#f0f0f0',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#eaebf0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  bookLocation: {
    fontSize: 12,
    color: '#999',
    flexShrink: 0,
  },


  // Bouton flottant
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Footer et messages
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessage: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },

  endMessageText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },

  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  locationInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  optionsList: {
    maxHeight: 300,
  },
  filterOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
