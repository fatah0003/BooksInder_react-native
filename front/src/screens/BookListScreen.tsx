import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal
} from 'react-native';
import { api, BookFilters } from '../services/api';
import { Book } from '../types/Book';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
  const [searchQuery, setSearchQuery] = useState(''); // ← Texte dans le champ (pas encore appliqué)
  const [appliedSearch, setAppliedSearch] = useState(''); // ← Recherche validée
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
      console.log('⚠️ Chargement déjà en cours');
      return;
    }

    isLoadingRef.current = true;

    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      console.log('📚 Requête avec filtres:', currentFilters);
      const response = await api.getBooks(page, 10, currentFilters);
      console.log('✅ Réponse reçue:', response.data.length, 'livres');
      
      if (refresh) {
        setBooks(response.data);
      } else {
        setBooks((prevBooks) => [...prevBooks, ...response.data]);
      }
      
      setHasNextPage(response.pagination.hasNextPage);
      setCurrentPage(page);
      setError(null);
    } catch (err: any) {
      console.error('❌ Erreur complète:', err);
      console.error('❌ Response:', err.response?.data);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  // ← NOUVELLE FONCTION : Valider la recherche
  const handleSearchSubmit = () => {
    console.log('🔍 Recherche validée:', searchQuery);
    setAppliedSearch(searchQuery);
    
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

    console.log('🎯 Application filtre:', filterType, '=', value);
    console.log('📋 Nouveaux filtres:', newFilters);

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
    
    // Si on supprime la recherche, vider aussi le champ
    if (filterKey === 'search') {
      setSearchQuery('');
      setAppliedSearch('');
    }
    
    console.log('🗑️ Suppression filtre:', filterKey);
    
    setFilters(newFilters);
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, newFilters);
  };

  const resetAllFilters = () => {
    console.log('🔄 Réinitialisation totale');
    setSearchQuery('');
    setAppliedSearch('');
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
        <ActivityIndicator size="large" color="#007AFF" />
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
      <Text style={styles.title}>Catalogue Booksinder</Text>

      {/* Barre de recherche avec bouton */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Rechercher un livre, auteur..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearchSubmit}
        >
          <Text style={styles.searchButtonText}>Rechercher</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
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
          <TouchableOpacity onPress={resetAllFilters}>
            <Text style={styles.resetButton}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Boutons de filtres */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterButtonsContainer}
      >
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => openFilterModal('location')}
        >
          <Text style={styles.filterButtonText}>📍 Ville</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => openFilterModal('category')}
        >
          <Text style={styles.filterButtonText}>📚 Catégorie</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => openFilterModal('exchange')}
        >
          <Text style={styles.filterButtonText}>🔄 Échange</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => openFilterModal('state')}
        >
          <Text style={styles.filterButtonText}>🏷️ État</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Liste des livres */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.bookCard}
            onPress={() => handleBookPress(item)}
          >
            {(() => {
              const frontImage = item.images.find(img => img.type === 'front');
              const imageToShow = frontImage || item.images[0];

              return imageToShow ? (
                <Image
                  source={{ uri: `http://192.168.1.115:8000${imageToShow.imageUrl}` }}
                  style={styles.bookImage}
                />
              ) : null;
            })()}
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>par {item.author}</Text>
            <Text style={styles.bookLocation}>📍 {item.location}</Text>
          </TouchableOpacity>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => {
          if (loadingMore) {
            return (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.footerText}>Chargement...</Text>
              </View>
            );
          }
          
          if (!hasNextPage && books.length > 0) {
            return (
              <View style={styles.endMessage}>
                <Text style={styles.endMessageText}>🎉 Vous avez tout vu !</Text>
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
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 14,
  },
  removeFilterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  filterButtonsContainer: {
  paddingHorizontal: 20,
  marginBottom: 15,
},
filterButton: {
  backgroundColor: '#f5f5f5',
  borderRadius: 20,
  paddingVertical: 10,
  paddingHorizontal: 16,
  marginRight: 10,
  marginBottom: 10,
  minHeight: 40,
  justifyContent: 'center',
},
filterButtonDisabled: {
  backgroundColor: '#e0e0e0',
  opacity: 0.5,
},
filterButtonText: {
  fontSize: 14,
  fontWeight: '600',
},

  bookCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  bookLocation: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  bookImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  endMessage: {
    padding: 20,
    alignItems: 'center',
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
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    backgroundColor: '#007AFF',
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
