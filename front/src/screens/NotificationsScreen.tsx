import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

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
      if (!item.isRead) {
        await api.markNotificationAsRead(item.id);
      }

      if (item.type === 'exchange_request' ||
        item.type === 'exchange_accepted' ||
        item.type === 'exchange_rejected' ||
        item.type === 'exchange_cancelled') {
        navigation.getParent()?.navigate('Profil', {
          screen: 'ReceivedExchanges',
        });
      } else if (item.type === 'message_received') {
        const notifData = typeof item.data === 'string'
          ? JSON.parse(item.data)
          : item.data;

        const conversationId = notifData.conversationId;
        const senderUuid = notifData.senderUuid;

        navigation.getParent()?.navigate('Chat', {
          screen: 'ChatScreen',
          params: {
            conversationId: conversationId,
            otherUserUuid: senderUuid,
          },
        });
      }

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
      case 'exchange_request': return 'mail-outline';
      case 'exchange_accepted': return 'checkmark-circle-outline';
      case 'exchange_rejected': return 'close-circle-outline';
      case 'exchange_cancelled': return 'ban-outline';
      case 'message_received': return 'chatbubble-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'exchange_request': return '#5B93FF';
      case 'exchange_accepted': return '#34C759';
      case 'exchange_rejected': return '#FF3B30';
      case 'exchange_cancelled': return '#FF9500';
      case 'message_received': return '#5B93FF';
      default: return '#999999';
    }
  };

  const renderItem = ({ item }: any) => {
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Icône */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]}>
            {item.title}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color="#999999" />
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Badge non lu */}
        {!item.isRead && <View style={styles.unreadBadge} />}

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const hasUnread = notifications.some((n: any) => !n.isRead);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity 
            style={styles.markAllButton} 
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllButtonText}>Marquer comme lues</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Liste */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadNotifications}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubtext}>
              Vous serez notifié des nouveaux messages et échanges
            </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAllButton: {
    backgroundColor: '#56b739',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#56b739',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  markAllButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  cardUnread: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#5B93FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#333333',
    marginBottom: 6,
    lineHeight: 20,
  },
  titleUnread: {
    fontWeight: '600',
    color: '#000000',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5B93FF',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
