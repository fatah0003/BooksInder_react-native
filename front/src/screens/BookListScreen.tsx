import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { Book } from '../types/Book';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function BookListScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  const { user } = useAuth();
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      setBooks([]);
      setCurrentPage(1);
      setHasNextPage(true);
      loadBooks(1, true);
    }, [])
  );

  const loadBooks = async (page: number = 1, refresh: boolean = false) => {
    if (refresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.getBooks(page, 10);
      
      if (refresh) {
        setBooks(response.data);
      } else {
        setBooks((prevBooks) => [...prevBooks, ...response.data]);
      }
      
      setHasNextPage(response.pagination.hasNextPage);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadBooks(nextPage, false);
    }
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
          onPress={() => {
            setBooks([]);
            setCurrentPage(1);
            setHasNextPage(true);
            loadBooks(1, true);
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalogue Booksinder</Text>

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
          
          return null;
        }}
      />

      {user && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddBook}>
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
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
    marginBottom: 20,
  },
  bookCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
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
});
