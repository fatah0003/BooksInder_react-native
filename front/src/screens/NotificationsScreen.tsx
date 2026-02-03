import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger au démarrage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Recharger à chaque fois qu'on revient sur l'écran
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.getNotifications(50, false);
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (item: any) => {
    try {
      // Marquer comme lue si pas encore lu
      if (!item.isRead) {
        await api.markNotificationAsRead(item.id);
      }

      // Navigation selon le type
      if (item.type === 'exchange_request' ||
        item.type === 'exchange_accepted' ||
        item.type === 'exchange_rejected' ||
        item.type === 'exchange_cancelled') {
        // Aller vers l'onglet Profil > Mes demandes
        navigation.getParent()?.navigate('Profil', {
          screen: 'ReceivedExchanges',
        });
      } else if (item.type === 'message_received') {
        // Extraire les données de la notification
        const notifData = typeof item.data === 'string'
          ? JSON.parse(item.data)
          : item.data;

        const conversationId = notifData.conversationId;
        const senderUuid = notifData.senderUuid;

        // Naviguer vers l'onglet Chat > ChatScreen
        navigation.getParent()?.navigate('Chat', {
          screen: 'ChatScreen',
          params: {
            conversationId: conversationId,
            otherUserUuid: senderUuid,
          },
        });
      }


      // Recharger pour mettre à jour le statut
      loadNotifications();
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await api.markAllNotificationsAsRead();
      Alert.alert('Succès', response.message);
      loadNotifications();
      navigation.getParent()?.setParams({ refresh: Date.now() });
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de marquer les notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'exchange_request': return '📬';
      case 'exchange_accepted': return '✅';
      case 'exchange_rejected': return '❌';
      case 'exchange_cancelled': return '🚫';
      case 'message_received': return '💬';
      default: return '🔔';
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  const hasUnread = notifications.some((n: any) => !n.isRead);

  return (
    <View style={styles.container}>
      {/* Bouton marquer tout comme lu */}
      {hasUnread && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButtonText}>✓ Tout marquer comme lu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadNotifications}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
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
  header: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  markAllButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  markAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  cardUnread: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  iconContainer: {
    marginRight: 15,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
  },
  titleUnread: {
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
