import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { API_URL, BASE_URL } from '../config/apiConfig';
import { styles } from './style/DetailExchangeScrenn.styles';

type DetailExchangeRouteProp = RouteProp<
  { DetailExchange: { exchangeUuid: string } },
  'DetailExchange'
>;

export default function DetailExchangeScreen() {
  const route = useRoute<DetailExchangeRouteProp>();
  const navigation = useNavigation();
  const { exchangeUuid } = route.params;
  const { user } = useAuth();

  const [exchange, setExchange] = useState<any>(null);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedExchangeType, setSelectedExchangeType] = useState<string>('temporary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExchangeDetail();
  }, []);

  const loadExchangeDetail = async () => {
    try {
      const response = await api.getExchangeDetail(exchangeUuid);
      const exchangeData = response.data || response;
      setExchange(exchangeData);

      if (exchangeData.userReceiver?.uuid === user?.uuid && exchangeData.status === 'pending') {
        const booksResponse = await api.getAvailableBooks(exchangeUuid);
        const books = booksResponse.data || booksResponse;
        setAvailableBooks(books);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les détails');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedBook) {
      Alert.alert('Attention', 'Veuillez sélectionner un livre à proposer en échange');
      return;
    }

    Alert.alert(
      'Accepter l\'échange',
      `Vous proposez "${selectedBook.title}" en échange ${selectedExchangeType === 'temporary' ? 'temporaire' : 'permanent'}. Confirmer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await api.acceptExchange(exchangeUuid, selectedBook.id, selectedExchangeType);
              Alert.alert('Succès', 'Échange accepté !', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'accepter');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Refuser l\'échange',
      'Êtes-vous sûr de vouloir refuser cette demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.rejectExchange(exchangeUuid);
              Alert.alert('Demande refusée', '', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de refuser');
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Annuler la demande',
      'Êtes-vous sûr de vouloir annuler cette demande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler la demande',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelExchange(exchangeUuid);
              Alert.alert('Demande annulée', '', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'annuler');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B93FF" />
      </View>
    );
  }

  if (!exchange) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Échange introuvable</Text>
      </View>
    );
  }

  const isReceiver = exchange.userReceiver?.uuid === user?.uuid;
  const isPending = exchange.status === 'pending';

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    validated: 'Accepté',
    rejected: 'Refusé',
  };

  const statusColors: Record<string, string> = {
    pending: '#FFA500',
    validated: '#34C759',
    rejected: '#FF3B30',
  };

  const statusIcons: Record<string, string> = {
    pending: 'time-outline',
    validated: 'checkmark-circle',
    rejected: 'close-circle',
  };

  return (
    <ScrollView style={styles.container}>
      {/* Statut Badge */}
      <View style={[styles.statusContainer, { backgroundColor: statusColors[exchange.status] }]}>
        <Ionicons name={statusIcons[exchange.status] as any} size={32} color="#FFFFFF" />
        <Text style={styles.statusLabel}>{statusLabels[exchange.status]}</Text>
      </View>

      {/* Livre demandé */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Livre demandé</Text>
        <View style={styles.bookCard}>
          <View style={styles.bookIconContainer}>
            <Ionicons name="book" size={32} color="#5B93FF" />
          </View>
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{exchange.bookOne?.title || 'Titre inconnu'}</Text>
            <Text style={styles.bookAuthor}>{exchange.bookOne?.author || 'Auteur inconnu'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#666666" />
          <Text style={styles.infoText}>
            Demandé par : <Text style={styles.infoTextuserName}>{exchange.userRequester?.infosUser?.userName || 'Utilisateur'}</Text>
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#666666" />
          <Text style={styles.infoText}>
            Le {new Date(exchange.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>

      {/* Si receiver + pending : Liste des livres disponibles */}
      {isReceiver && isPending && availableBooks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisissez un livre à proposer</Text>
          {availableBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={[
                styles.selectableBookCard,
                selectedBook?.id === book.id && styles.selectableBookCardActive,
              ]}
              onPress={() => setSelectedBook(book)}
            >
              {book.images?.[0] ? (
                <Image
                  source={{ uri: `${BASE_URL}${book.images[0].imageUrl}` }}
                  style={styles.bookImage}
                />
              ) : (
                <View style={styles.bookImagePlaceholder}>
                  <Ionicons name="book-outline" size={32} color="#999999" />
                </View>
              )}
              
              <View style={styles.bookInfo}>
                <Text style={styles.selectableBookTitle} numberOfLines={2}>
                  {book.title}
                </Text>
                <Text style={styles.selectableBookAuthor}>{book.author}</Text>
              </View>

              {selectedBook?.id === book.id && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={28} color="#34C759" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Type d'échange */}
      {isReceiver && isPending && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type d'échange</Text>
          <View style={styles.exchangeTypeContainer}>
            <TouchableOpacity
              style={[
                styles.exchangeTypeButton,
                selectedExchangeType === 'temporary' && styles.exchangeTypeButtonActive,
              ]}
              onPress={() => setSelectedExchangeType('temporary')}
            >
              <Ionicons 
                name="sync-outline" 
                size={24} 
                color={selectedExchangeType === 'temporary' ? '#5B93FF' : '#999999'} 
              />
              <Text
                style={[
                  styles.exchangeTypeText,
                  selectedExchangeType === 'temporary' && styles.exchangeTypeTextActive,
                ]}
              >
                Temporaire
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exchangeTypeButton,
                selectedExchangeType === 'permanent' && styles.exchangeTypeButtonActive,
              ]}
              onPress={() => setSelectedExchangeType('permanent')}
            >
              <Ionicons 
                name="swap-horizontal" 
                size={24} 
                color={selectedExchangeType === 'permanent' ? '#5B93FF' : '#999999'} 
              />
              <Text
                style={[
                  styles.exchangeTypeText,
                  selectedExchangeType === 'permanent' && styles.exchangeTypeTextActive,
                ]}
              >
                Permanent
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Boutons d'action */}
      {isReceiver && isPending && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isReceiver && isPending && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.cancelButtonText}>Annuler la demande</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Si validé : Afficher le livre choisi */}
      {exchange.status === 'validated' && exchange.bookTwo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livre proposé en échange</Text>
          <View style={styles.bookCard}>
            <View style={styles.bookIconContainer}>
              <Ionicons name="book" size={32} color="#34C759" />
            </View>
            <View style={styles.bookDetails}>
              <Text style={styles.bookTitle}>{exchange.bookTwo.title}</Text>
              <Text style={styles.bookAuthor}>Échange {exchange.exchangeType}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}
