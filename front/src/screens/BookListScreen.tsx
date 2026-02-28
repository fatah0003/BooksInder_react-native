import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import { api, BookFilters } from '../services/api';
import { Book } from '../types/Book';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/BookListScreen.styles';
import BookCard from '../components/BookCard';
import FilterModal from '../components/FilterModal';
import { BOOK_CATEGORIES, BOOK_STATES, EXCHANGE_TYPES } from '../constants/bookOptions';

type FilterType = 'location' | 'category' | 'exchange' | 'state';

export default function BookListScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

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
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    refresh ? setLoading(true) : setLoadingMore(true);

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
    if (isLoadingRef.current || !hasNextPage) return;
    loadBooks(currentPage + 1, false, filters);
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
          { text: 'Se connecter', onPress: () => navigation.navigate('Profil' as never) }
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
          { text: 'Se connecter', onPress: () => navigation.navigate('Profil' as never) }
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
    if (filterType === 'location') newFilters.location = value;
    else if (filterType === 'category') newFilters.category = value;
    else if (filterType === 'exchange') newFilters.availableExchangeType = value;
    else if (filterType === 'state') newFilters.state = value;

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
    if (filterKey === 'search') setSearchQuery('');
    setFilters(newFilters);
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, newFilters);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilters({});
    setBooks([]);
    setCurrentPage(1);
    setHasNextPage(true);
    isLoadingRef.current = false;
    loadBooks(1, true, {});
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
        <TouchableOpacity style={styles.retryButton} onPress={resetAndLoad}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoBook}>Books</Text>
          <Text style={styles.logoInder}>Inder</Text>
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

      {/* Chips de filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topFiltersContainer}
        contentContainerStyle={styles.topFiltersContent}
      >
        {([
          { key: 'location', label: 'Ville',          filterKey: 'location' },
          { key: 'category', label: 'Catégorie',      filterKey: 'category' },
          { key: 'exchange', label: "Type d'échange", filterKey: 'availableExchangeType' },
          { key: 'state',    label: 'État',           filterKey: 'state' },
        ] as { key: FilterType; label: string; filterKey: keyof BookFilters }[]).map(({ key, label, filterKey }) => (
          <TouchableOpacity
            key={key}
            style={[styles.topFilterChip, filters[filterKey] && styles.topFilterChipActive]}
            onPress={() => openFilterModal(key)}
          >
            <Text style={[styles.topFilterText, filters[filterKey] && styles.topFilterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
            {filters.search && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => removeFilter('search')}>
                <Text style={styles.activeFilterText}>🔍 {filters.search}</Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.location && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => removeFilter('location')}>
                <Text style={styles.activeFilterText}>📍 {filters.location}</Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.category && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => removeFilter('category')}>
                <Text style={styles.activeFilterText}>
                  📚 {BOOK_CATEGORIES.find(c => c.value === filters.category)?.label}
                </Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.availableExchangeType && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => removeFilter('availableExchangeType')}>
                <Text style={styles.activeFilterText}>
                  🔄 {EXCHANGE_TYPES.find(e => e.value === filters.availableExchangeType)?.label}
                </Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
            {filters.state && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => removeFilter('state')}>
                <Text style={styles.activeFilterText}>
                  🏷️ {BOOK_STATES.find(s => s.value === filters.state)?.label}
                </Text>
                <Text style={styles.removeFilterText}> ✕</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
        renderItem={({ item }) => (
          <BookCard book={item} onPress={handleBookPress} />
        )}
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

      {/* Modal filtres */}
      <FilterModal
        visible={modalVisible}
        activeFilterType={activeFilterType}
        tempLocationInput={tempLocationInput}
        onLocationChange={setTempLocationInput}
        onApply={applyFilter}
        onClose={() => setModalVisible(false)}
      />

    </View>
  );
}