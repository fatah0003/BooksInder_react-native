import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Book } from '../types/Book';
import { api } from '../services/api';

type BookDetailRouteProp = RouteProp<{ BookDetail: { bookUuid: string } }, 'BookDetail'>;

export default function BookDetailScreen() {
  const route = useRoute<BookDetailRouteProp>();
  const { bookUuid } = route.params;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookDetail();
  }, []);

  const loadBookDetail = async () => {
    try {
      const data = await api.getBookDetail(bookUuid);
      setBook(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur : {error || 'Livre introuvable'}</Text>
      </View>
    );
  }

  // Trouver l'image front et back
  const frontImage = book.images.find(img => img.type === 'front');
  const backImage = book.images.find(img => img.type === 'back');

  // Traduire l'état du livre
  const stateLabels: Record<string, string> = {
    'new': 'Neuf',
    'like_new': 'Comme neuf',
    'good': 'Bon état',
    'acceptable': 'État acceptable'
  };

  return (
    <ScrollView style={styles.container}>
      {/* Images */}
      <View style={styles.imagesContainer}>
        {frontImage && (
          <Image
            source={{ uri: `http://192.168.1.115:8000${frontImage.imageUrl}` }}
            style={styles.mainImage}
          />
        )}
        {backImage && (
          <Image
            source={{ uri: `http://192.168.1.115:8000${backImage.imageUrl}` }}
            style={styles.secondaryImage}
          />
        )}
      </View>

      {/* Informations principales */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>par {book.author}</Text>
        
        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{book.description}</Text>

        <View style={styles.separator} />

        {/* Détails techniques */}
        <Text style={styles.sectionTitle}>Détails</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ISBN :</Text>
          <Text style={styles.detailValue}>{book.isbn}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Édition :</Text>
          <Text style={styles.detailValue}>{book.edition}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Pages :</Text>
          <Text style={styles.detailValue}>{book.pages}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>État :</Text>
          <Text style={styles.detailValue}>{stateLabels[book.state] || book.state}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Localisation :</Text>
          <Text style={styles.detailValue}>📍 {book.location}</Text>
        </View>

        <View style={styles.separator} />

        {/* Catégories */}
        {book.categorie.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.categoriesContainer}>
              {book.categorie.map((cat, index) => (
                <View key={index} style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Types d'échange disponibles */}
        {book.availableExchangeTypes.length > 0 && (
          <>
            <View style={styles.separator} />
            <Text style={styles.sectionTitle}>Types d'échange acceptés</Text>
            <View style={styles.categoriesContainer}>
              {book.availableExchangeTypes.map((type, index) => (
                <View key={index} style={styles.exchangeBadge}>
                  <Text style={styles.exchangeText}>{type}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imagesContainer: {
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: '100%',
    height: 400,
    resizeMode: 'contain',
  },
  secondaryImage: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginTop: 10,
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  author: {
    fontSize: 18,
    color: '#666',
    marginBottom: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 120,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    color: '#1976d2',
    fontSize: 14,
  },
  exchangeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  exchangeText: {
    color: '#388e3c',
    fontSize: 14,
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
  },
});
