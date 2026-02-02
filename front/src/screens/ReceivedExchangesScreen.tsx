import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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

  // Charger les demandes au démarrage et quand on change d'onglet
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
          // Filtrer seulement les pending
          const pendingOnly = response.data.filter((ex: any) => ex.status === 'pending');
          setSentExchanges(pendingOnly);
        }
      } else {
        // Historique : tous les échanges terminés
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
  
  // Pour l'historique, déterminer si je suis le requester ou le receiver
  const isRequester = item.userRequester?.uuid === user?.uuid;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetailExchange', { exchangeUuid: item.uuid })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>
          {isHistory && !isRequester 
            ? (item.bookTwo?.title || 'Livre inconnu')  // Si je suis receiver, afficher bookTwo
            : (item.bookOne?.title || 'Livre inconnu')  // Sinon bookOne
          }
        </Text>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>
            {item.status === 'pending' ? 'En attente' : 
             item.status === 'validated' ? 'Accepté' : 'Refusé'}
          </Text>
        </View>
      </View>
      <Text style={styles.subtitle}>
        {isHistory 
          ? isRequester
            ? `Échangé avec : ${item.userReceiver?.infosUser?.userName || 'Utilisateur'}`
            : `Échangé avec : ${item.userRequester?.infosUser?.userName || 'Utilisateur'}`
          : isReceived 
            ? `Demandé par : ${item.userRequester?.infosUser?.userName || 'Utilisateur'}`
            : `Demandé à : ${item.userReceiver?.infosUser?.userName || 'Utilisateur'}`
        }
      </Text>
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
      </Text>
      
      {/* Si validé, afficher le livre échangé */}
      {item.status === 'validated' && item.bookTwo && (
        <View style={styles.exchangeInfo}>
          <Text style={styles.exchangeText}>
            ↔️ {isRequester 
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
        ListEmptyComponent={
          <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  exchangeInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  exchangeText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
});
