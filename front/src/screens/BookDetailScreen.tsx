import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Book } from '../types/Book';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/bookService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../config/apiConfig';
import { styles } from './style/Bookdetailscreen.styles';

type BookDetailRouteProp = RouteProp<{ BookDetail: { bookUuid: string } }, 'BookDetail'>;

export default function BookDetailScreen() {
  const route = useRoute<BookDetailRouteProp>();
  const navigation = useNavigation();
  const { bookUuid } = route.params;
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingExchange, setExistingExchange] = useState<any>(null);
  const [checkingExchange, setCheckingExchange] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isMyBook, setIsMyBook] = useState(false);

  // Vérifier si le livre est en favori
  const checkIfFavoriteWithId = async (bookId: number) => {
    try {
      const response = await api.checkFavorite(bookId);
      setIsFavorite(response.isFavorite);
      return response.isFavorite;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.warn('Erreur vérification favori:', error.message);
      }
      return false;
    }
  };

  // Vérifier si c'est mon livre
  const checkIfMyBookWithUuid = async (ownerUuid: string) => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        setIsMyBook(currentUser.uuid === ownerUuid);
      }
    } catch (error: any) {
      console.warn('Erreur vérification propriétaire:', error.message);
    }
  };

  // Toggle favori
  const handleToggleFavorite = async () => {
    if (!book?.id) return;
    if (isMyBook) {
      Alert.alert('Impossible', 'Vous ne pouvez pas ajouter votre propre livre en favori');
      return;
    }

    try {
      const response = await api.toggleFavorite(book.id);
      setIsFavorite(response.isFavorite);
      Alert.alert('Succès', response.message, [{ text: 'OK' }]);
    } catch (error: any) {
      if (error.response?.status === 401) {
        return;
      }
      console.warn('Erreur toggle favori:', error.message);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de modifier les favoris');
    }
  };

  // Charger les détails du livre
  const loadBookDetail = async () => {
    try {
      const response = await api.getBookDetail(bookUuid);
      const bookData = response.data || response;

      setBook(bookData);
      setLoading(false);

      const promises = [];

      if (bookData.id) {
        promises.push(checkIfFavoriteWithId(bookData.id));
      }
      if (bookData.user?.uuid) {
        promises.push(checkIfMyBookWithUuid(bookData.user.uuid));
      }
      if (bookData.uuid && user) {
        promises.push(checkExistingExchange(bookData.uuid));
      }

      // Gestion silencieuse des erreurs 401
      Promise.all(promises).catch(err => {
        if (err.response?.status !== 401) {
          console.warn('Erreur chargement données secondaires:', err.message);
        }
      });

    } catch (err: any) {
      // Gestion silencieuse des erreurs 401
      if (err.response?.status !== 401) {
        console.warn('Erreur chargement détail livre:', err.message);
      }
      setError(err.message);
      setLoading(false);
    }
  };

  // Vérifier si une demande d'échange existe déjà
  const checkExistingExchange = async (bookUuid: string) => {
    if (!user) return;

    setCheckingExchange(true);
    try {
      const response = await api.getSentExchanges(50);
      if (response.success) {
        const existing = response.data.find(
          (ex: any) => ex.bookOne?.uuid === bookUuid && ex.status === 'pending'
        );
        setExistingExchange(existing || null);
      }
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.warn('Erreur vérification demande:', error.message);
      }
    } finally {
      setCheckingExchange(false);
    }
  };

  useEffect(() => {
    loadBookDetail();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (book?.id) {
        checkIfFavoriteWithId(book.id);
      }
      if (book?.uuid && user) {
        checkExistingExchange(book.uuid);
      }
    }, [book?.id, book?.uuid, user])
  );

  const isOwner = user && book?.user && user.uuid === book.user.uuid;

  const handleOwnerPress = () => {
    if (!book?.user) return;

    if (user?.uuid === book.user.uuid) {
      navigation.navigate('Profil' as never);
    } else {
      navigation.navigate('UserPublicProfile' as never, { userUuid: book.user.uuid } as never);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce livre',
      'Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookService.delete(bookUuid);
              Alert.alert('Succès', 'Le livre a été supprimé', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de supprimer le livre');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditBook' as never, { bookUuid, book } as never);
  };

  const handleRequestExchange = async () => {
  if (!user) {
    Alert.alert('Connexion requise', 'Vous devez être connecté pour demander un échange');
    return;
  }

  if (!book) return;

  // VÉRIFICATION : L'utilisateur a-t-il au moins un livre actif ?
  try {
    const myBooks = await api.getMyBooks();
    const activeBooks = myBooks.filter(b => b.bookStatus === 'active');

    if (activeBooks.length === 0) {
      Alert.alert(
        'Aucun livre disponible',
        'Pour demander un échange, vous devez avoir au moins un livre actif dans votre bibliothèque.',
        [
          {
            text: 'Ajouter un livre',
            onPress: () => {
              // Navigate vers l'écran d'ajout de livre
              navigation.getParent()?.navigate('Livres', {
                screen: 'AddBook'
              });
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    // L'utilisateur a des livres actifs, on continue
    Alert.alert(
      'Demander un échange',
      `Voulez-vous demander "${book.title}" ?\n\nVous avez ${activeBooks.length} livre(s) disponible(s) à proposer en échange.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              if (!book.id) {
                Alert.alert('Erreur', 'ID du livre introuvable');
                return;
              }

              await api.createExchange(book.id);

              Alert.alert(
                'Demande envoyée !',
                'Le propriétaire du livre recevra votre demande et choisira un de vos livres en échange.',
                [{
                  text: 'OK',
                  onPress: () => {
                    if (book.uuid) {
                      checkExistingExchange(book.uuid);
                    }
                  }
                }]
              );

            } catch (error: any) {
              const errorMessage = error.response?.data?.message
                || error.response?.data?.errors
                || error.message
                || 'Impossible d\'envoyer la demande';

              Alert.alert('Erreur', typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
            }
          },
        },
      ]
    );

  } catch (error: any) {
    // Gestion silencieuse des erreurs 401
    if (error.response?.status !== 401) {
      console.warn('Erreur vérification livres disponibles:', error.message);
      Alert.alert('Erreur', 'Impossible de vérifier vos livres disponibles');
    }
  }
};


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !book) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur : {error || 'Livre introuvable'}</Text>
      </View>
    );
  }

  const frontImage = book.images.find((img) => img.type === 'front');
  const backImage = book.images.find((img) => img.type === 'back');

  const categoryLabels: Record<string, string> = {
    fiction: 'Fiction',
    science_fiction: 'Science Fiction',
    philosophy: 'Philosophie',
    historical: 'Histoire',
  };

  const stateLabels: Record<string, string> = {
    new: 'Neuf',
    like_new: 'Comme neuf',
    very_good: 'Très bon état',
    good: 'Bon état',
    acceptable: 'État acceptable',
    well_loved: 'Bien vécu',
  };

  const exchangeTypeLabels: Record<string, string> = {
    temporary: 'Temporaire',
    permanent: 'Permanent',
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header avec titre centré */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{book.title}</Text>
      </View>

      {/* Images centrées et réduites */}
      <View style={styles.imagesContainer}>
        {frontImage && (
          <Image
            source={{ uri: `${BASE_URL}${frontImage.imageUrl}` }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        )}
        {backImage && (
          <Image
            source={{ uri: `${BASE_URL}${backImage.imageUrl}` }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Informations principales */}
      <View style={styles.infoContainer}>
        {/* Auteur + Bouton favori */}
        <View style={styles.authorRow}>
          <Text style={styles.author}>{book.author}</Text>

          {!isOwner && user && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleToggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? '#e53935' : '#999'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <Text style={styles.description}>{book.description}</Text>

        {/* Propriétaire */}
        {book.user && (
          <TouchableOpacity onPress={handleOwnerPress}>
            <Text style={styles.ownerText}>
              Proposé par{' '}
              <Text style={styles.ownerName}>
                {isOwner ? 'Vous' : `@${book.user.infosUser?.userName || 'UserName'}`}
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Section Détails */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Détails</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ISBN :</Text>
            <Text style={styles.detailValue}>{book.isbn}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Edition</Text>
            <Text style={styles.detailValue}>{book.edition}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Page :</Text>
            <Text style={styles.detailValue}>{book.pages}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Etat</Text>
            <Text style={styles.detailValue}>{stateLabels[book.state] || book.state}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Localisation</Text>
            <Text style={styles.detailValue}>{book.location}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Catégorie</Text>
            <Text style={styles.detailValue}>
              {book.categorie
                .map(cat => categoryLabels[cat] || cat)
                .join(', ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type d'échange accepté :</Text>
            <Text style={styles.detailValue}>
              {book.availableExchangeTypes
                .map(type => exchangeTypeLabels[type] || type)
                .join(', ')}
            </Text>
          </View>
        </View>

        {/* Boutons d'action */}
        {!isOwner && user && book.bookStatus === 'active' && (
          <>
            {existingExchange ? (
              <TouchableOpacity
                style={styles.exchangeButton}
                onPress={() => navigation.navigate('DetailExchange' as never, { exchangeUuid: existingExchange.uuid } as never)}
              >
                <Text style={styles.exchangeButtonText}>Voir ma demande</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.exchangeButton}
                onPress={handleRequestExchange}
                disabled={checkingExchange}
              >
                <Text style={styles.exchangeButtonText}>
                  {checkingExchange ? 'Vérification...' : 'Demander un échange'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Boutons propriétaire */}
        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity style={styles.modifyButton} onPress={handleEdit}>
              <Text style={styles.modifyButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
