import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type TabType = 'received' | 'sent' | 'history';

export default function ReceivedExchangesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [receivedExchanges, setReceivedExchanges] = useState([]);
  const [sentExchanges, setSentExchanges] = useState([]);
  const [historyExchanges, setHistoryExchanges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExchanges();
  }, [activeTab]);

  const loadExchanges = async () => {
    setLoading(true);
    try {
      if (activeTab === 'received') {
        const response = await api.getReceivedExchanges('pending', 20);
        if (response.success) {
          setReceivedExchanges(response.data);
        }
      } else if (activeTab === 'sent') {
        const response = await api.getSentExchanges(20);
        if (response.success) {
          const pendingOnly = response.data.filter((ex: any) => ex.status === 'pending');
          setSentExchanges(pendingOnly);
        }
      } else {
        const response = await api.getCompletedExchanges(20);
        if (response.success) {
          setHistoryExchanges(response.data);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const isHistory = activeTab === 'history';
    const isReceived = activeTab === 'received';
    const isRequester = item.userRequester?.uuid === user?.uuid;
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetailExchange', { exchangeUuid: item.uuid })}
      >
        <View style={styles.cardContent}>
          {/* Icône de statut */}
          <View style={[styles.statusIcon, styles[`statusIcon_${item.status}`]]}>
            <Ionicons 
              name={
                item.status === 'pending' ? 'time-outline' : 
                item.status === 'validated' ? 'checkmark-circle' : 'close-circle'
              } 
              size={24} 
              color="#FFFFFF" 
            />
          </View>

          {/* Contenu */}
          <View style={styles.cardInfo}>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {isHistory && !isRequester 
                ? (item.bookTwo?.title || 'Livre inconnu')
                : (item.bookOne?.title || 'Livre inconnu')
              }
            </Text>
            
            <View style={styles.userRow}>
              <Ionicons name="person-outline" size={14} color="#999999" />
              <Text style={styles.userName}>
                {isHistory 
                  ? isRequester
                    ? item.userReceiver?.infosUser?.userName || 'Utilisateur'
                    : item.userRequester?.infosUser?.userName || 'Utilisateur'
                  : isReceived 
                    ? item.userRequester?.infosUser?.userName || 'Utilisateur'
                    : item.userReceiver?.infosUser?.userName || 'Utilisateur'
                }
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#999999" />
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>

            {/* Badge de statut */}
            <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
              <Text style={styles.statusText}>
                {item.status === 'pending' ? 'En attente' : 
                 item.status === 'validated' ? 'Accepté' : 'Refusé'}
              </Text>
            </View>
          </View>

          {/* Flèche */}
          <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
        </View>

        {/* Info échange validé */}
        {item.status === 'validated' && item.bookTwo && (
          <View style={styles.exchangeInfo}>
            <Ionicons name="swap-horizontal" size={16} color="#34C759" />
            <Text style={styles.exchangeText}>
              {isRequester 
                ? `Reçu : ${item.bookTwo.title}`
                : `Donné : ${item.bookOne.title}`
              }
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getCurrentData = () => {
    if (activeTab === 'received') return receivedExchanges;
    if (activeTab === 'sent') return sentExchanges;
    return historyExchanges;
  };

  const getEmptyMessage = () => {
    if (activeTab === 'received') return 'Aucune demande reçue';
    if (activeTab === 'sent') return 'Aucune demande envoyée';
    return 'Aucun historique d\'échange';
  };

  return (
    <View style={styles.container}>
      {/* Header avec titre */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes échanges</Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            Reçues
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            Envoyées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <FlatList
        data={getCurrentData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.uuid}
        refreshing={loading}
        onRefresh={loadExchanges}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#5B93FF',
  },
  tabText: {
    fontSize: 15,
    color: '#999999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#5B93FF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon_pending: {
    backgroundColor: '#FFA500',
  },
  statusIcon_validated: {
    backgroundColor: '#34C759',
  },
  statusIcon_rejected: {
    backgroundColor: '#FF3B30',
  },
  cardInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  status_pending: {
    backgroundColor: '#FFF3CD',
  },
  status_validated: {
    backgroundColor: '#D4EDDA',
  },
  status_rejected: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  exchangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  exchangeText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
    textAlign: 'center',
  },
});
