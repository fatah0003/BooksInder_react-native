import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl, Image } from 'react-native';
import { api } from '../services/api';
import { Book } from '../types/Book';
import { Ionicons } from '@expo/vector-icons';

export default function AdminBooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await api.getBooks(1, 100); // Récupère jusqu'à 100 livres
      setBooks(response.data);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les livres');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = (uuid: string, title: string) => {
  Alert.alert(
    'Supprimer le livre',
    `Voulez-vous vraiment supprimer "${title}" ?\n\nCette action est irréversible.`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🗑️ Tentative suppression:', uuid);
            const result = await api.deleteBook(uuid);
            console.log('Résultat:', result);
            Alert.alert('Succès', 'Livre supprimé avec succès');
            loadBooks();
          } catch (error: any) {
            console.error('Erreur suppression:', error);
            console.error('Response:', error.response?.data);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Impossible de supprimer';
            Alert.alert('Erreur', errorMsg);
          }
        },
      },
    ]
  );
};


  const renderBook = ({ item }: { item: Book }) => {
    const frontImage = item.images?.find((img) => img.type === 'front');

    return (
      <View style={styles.bookCard}>
        {frontImage?.imageUrl ? (
          <Image source={{ uri: frontImage.imageUrl }} style={styles.bookImage} />
        ) : (
          <View style={[styles.bookImage, styles.noImage]}>
            <Ionicons name="book" size={30} color="#CCC" />
          </View>
        )}

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={styles.bookOwner}>
            <Ionicons name="person-outline" size={18} color="#666" /> {item.user?.infosUser?.userName || item.user?.email || 'Inconnu'}
          </Text>
          <Text style={styles.bookLocation}> <Ionicons name="location-outline" size={20} color="#666" /> {item.location}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBook(item.uuid, item.title)}
        >
          <Ionicons name="trash" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Total : <Text style={styles.statsBold}>{books.length}</Text> livres
        </Text>
      </View>

      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={(item) => item.uuid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBooks} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>Aucun livre trouvé</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsBar: {
    backgroundColor: '#FFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsBold: {
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    padding: 15,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  bookAuthor: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  bookOwner: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  bookLocation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
});
