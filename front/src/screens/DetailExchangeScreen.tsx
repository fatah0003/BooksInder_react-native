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
      console.log('📦 Réponse détail échange:', JSON.stringify(response, null, 2));
      
      const exchangeData = response.data || response;
      setExchange(exchangeData);

      // Si je suis le receiver et que c'est en attente, charger les livres dispo
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!exchange) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Échange introuvable</Text>
      </View>
    );
  }

  const isReceiver = exchange.userReceiver?.uuid === user?.uuid;
  const isPending = exchange.status === 'pending';

  // ✅ LOGS DE DEBUG ICI (AVANT LE RETURN)
  console.log('🔍 Debug Exchange:');
  console.log('- exchange.userReceiver?.uuid:', exchange.userReceiver?.uuid);
  console.log('- exchange.userRequester?.uuid:', exchange.userRequester?.uuid);
  console.log('- user?.uuid:', user?.uuid);
  console.log('- isReceiver:', isReceiver);
  console.log('- isPending:', isPending);
  console.log('- exchange.bookOne:', exchange.bookOne);
  console.log('- exchange.userRequester:', exchange.userRequester);

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

  return (
    <ScrollView style={styles.container}>
      {/* Statut */}
      <View style={[styles.statusBadge, { backgroundColor: statusColors[exchange.status] }]}>
        <Text style={styles.statusText}>{statusLabels[exchange.status]}</Text>
      </View>

      {/* Informations de l'échange */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Livre demandé</Text>
        <Text style={styles.bookTitle}>{exchange.bookOne?.title || 'Titre inconnu'}</Text>
        <Text style={styles.subtitle}>
          Demandé par : {exchange.userRequester?.infosUser?.userName || 'Utilisateur'}
        </Text>
        <Text style={styles.date}>
          Le {new Date(exchange.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {/* Si receiver + pending : Afficher les livres disponibles */}
      {isReceiver && isPending && availableBooks.length > 0 && (
        <>
          <View style={styles.separator} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livre souhaité en échange</Text>
            {availableBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={[
                  styles.bookCard,
                  selectedBook?.id === book.id && styles.bookCardSelected,
                ]}
                onPress={() => setSelectedBook(book)}
              >
                {book.images?.[0] && (
                  <Image
                    source={{ uri: `http://192.168.1.115:8000${book.images[0].imageUrl}` }}
                    style={styles.bookImage}
                  />
                )}
                <View style={styles.bookInfo}>
                  <Text style={styles.bookCardTitle}>{book.title}</Text>
                  <Text style={styles.bookCardAuthor}>{book.author}</Text>
                </View>
                {selectedBook?.id === book.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Type d'échange */}
          <View style={styles.separator} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type d'échange</Text>
            <View style={styles.exchangeTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.exchangeTypeButton,
                  selectedExchangeType === 'temporary' && styles.exchangeTypeButtonSelected,
                ]}
                onPress={() => setSelectedExchangeType('temporary')}
              >
                <Text
                  style={[
                    styles.exchangeTypeText,
                    selectedExchangeType === 'temporary' && styles.exchangeTypeTextSelected,
                  ]}
                >
                  Temporaire
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.exchangeTypeButton,
                  selectedExchangeType === 'permanent' && styles.exchangeTypeButtonSelected,
                ]}
                onPress={() => setSelectedExchangeType('permanent')}
              >
                <Text
                  style={[
                    styles.exchangeTypeText,
                    selectedExchangeType === 'permanent' && styles.exchangeTypeTextSelected,
                  ]}
                >
                  Permanent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Boutons Accepter / Refuser */}
          <View style={styles.separator} />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
              <Text style={styles.acceptButtonText}>✓ Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Text style={styles.rejectButtonText}>✕ Refuser</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Si requester + pending : Bouton Annuler */}
      {!isReceiver && isPending && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Annuler la demande</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Si validé : Afficher le livre proposé */}
      {exchange.status === 'validated' && exchange.bookTwo && (
        <>
          <View style={styles.separator} />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livre choisi</Text>
            <Text style={styles.bookTitle}>{exchange.bookTwo.title}</Text>
            <Text style={styles.subtitle}>Échange {exchange.exchangeType}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBadge: {
    padding: 15,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  bookCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  bookCardSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  bookImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
    marginRight: 15,
  },
  bookInfo: {
    flex: 1,
  },
  bookCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bookCardAuthor: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  exchangeTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  exchangeTypeButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f5f5f5',
  },
  exchangeTypeButtonSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#34C759',
  },
  exchangeTypeText: {
    fontSize: 16,
    color: '#666',
  },
  exchangeTypeTextSelected: {
    color: '#34C759',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    margin: 20,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
