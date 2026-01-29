import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { api } from '../services/api';
import { Book } from '../types/Book';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function BookListScreen() {
  // États pour stocker les données
  const [books, setBooks] = useState<Book[]>([]);  // Liste des livres
  const [loading, setLoading] = useState(true);     // Indicateur de chargement
  const [error, setError] = useState<string | null>(null);  // Message d'erreur

  const { user } = useAuth();
  const navigation = useNavigation();

  // useEffect : se lance au chargement de l'écran
  useEffect(() => {
    loadBooks();
  }, []);

  // Fonction pour charger les livres depuis l'API
  const loadBooks = async () => {
    try {
      const data = await api.getBooks();
      setBooks(data);  // On met les livres dans l'état
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);  // Chargement terminé
    }
  };

  // clic sur un livre pour voir les détail
  const handleBookPress = (book: Book) => {
    if (user) {
      // Utilisateur connecté → Navigation vers détails
      navigation.navigate('BookDetail' as never, { bookUuid: book.uuid } as never);
    } else {
      // Utilisateur non connecté → Message + Redirection vers connexion
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour consulter les détails d\'un livre.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => navigation.navigate('Profil' as never) // Va vers l'onglet Profil = AuthStack
          }
        ]
      );
    }
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des livres...</Text>
      </View>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur : {error}</Text>
      </View>
    );
  }

  // Affichage de la liste
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalogue Booksinder ({books.length} livres)</Text>

      <FlatList
        data={books}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bookCard}
            onPress={() => handleBookPress(item)}
          >
            {(() => {
              // Chercher l'image de type "front" en priorité
              const frontImage = item.images.find(img => img.type === 'front');
              // Si pas de front, prendre la première image
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
      />

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
  },
  bookImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
});
