import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
                  source={{ uri: `http://192.168.1.115:8000${book.images[0].imageUrl}` }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerPlaceholder: {
    width: 44,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bookIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookDetails: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  infoTextuserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B93FF',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#666666',
    marginLeft: 12,
  },
  selectableBookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectableBookCardActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34C759',
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  bookImagePlaceholder: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  selectableBookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  selectableBookAuthor: {
    fontSize: 13,
    color: '#666666',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  exchangeTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  exchangeTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  exchangeTypeButtonActive: {
    backgroundColor: '#E8F1FF',
    borderColor: '#5B93FF',
  },
  exchangeTypeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666',
  },
  exchangeTypeTextActive: {
    color: '#5B93FF',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});
