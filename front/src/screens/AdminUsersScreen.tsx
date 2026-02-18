import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../services/api';
import { User } from '../types/User';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function AdminUsersScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
  try {
    setLoading(true);
    const response = await api.getAllUsers();
    const usersData = response.data || response.users || response;
    setUsers(Array.isArray(usersData) ? usersData : []);
  } catch (error: any) {
    Alert.alert('Erreur', error.response?.data?.message || 'Impossible de charger les utilisateurs');
  } finally {
    setLoading(false);
  }
};



  const handleDeleteUser = (uuid: string, email: string) => {
    // Empêcher la suppression de son propre compte
    if (currentUser?.uuid === uuid) {
      Alert.alert('Action impossible', 'Vous ne pouvez pas supprimer votre propre compte admin.');
      return;
    }

    Alert.alert(
      'Supprimer l\'utilisateur',
      `Voulez-vous vraiment supprimer ${email} ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteUser(uuid);
              Alert.alert('Succès', 'Utilisateur supprimé avec succès');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.message || 'Impossible de supprimer');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isAdmin = item.roles.includes('ROLE_ADMIN');
    const isCurrentUser = item.uuid === currentUser?.uuid;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.userName}>
              {item.infosUser?.userName || 'Profil incomplet'}
            </Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#FFF" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {item.userStatus === 'deleted' && (
              <View style={styles.deletedBadge}>
                <Ionicons name="trash" size={14} color="#FFF" />
                <Text style={styles.deletedBadgeText}>Supprimé</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userCity}>📍 {item.infosUser?.city || 'Non renseigné'}</Text>
        </View>

        {!isCurrentUser ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.uuid, item.email)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={styles.currentUserBadge}>
            <Text style={styles.currentUserText}>Vous</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Total : <Text style={styles.statsBold}>{users.length}</Text> utilisateurs
        </Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.uuid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statsBar: {
    backgroundColor: '#FFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsBold: {
    fontWeight: 'bold',
    color: '#111827',
  },
  listContainer: {
    padding: 15,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 3,
  },
  userCity: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 10,
  },
  currentUserBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentUserText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
  deletedBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#EF4444',
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 12,
  marginLeft: 5,
},
deletedBadgeText: {
  fontSize: 11,
  color: '#FFF',
  fontWeight: '600',
  marginLeft: 4,
},
});
