import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Book } from '../types/Book';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger mes livres à chaque fois que l'écran est affiché
  useFocusEffect(
    React.useCallback(() => {
      loadMyBooks();
      loadUnreadCount();
    }, [])
  );
  // Polling automatique toutes les 30 secondes
  useEffect(() => {
    if (!user) return;

    // Charger immédiatement
    loadUnreadCount();

    // Puis toutes les 30 secondes
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30 secondes = 30000 ms

    // Nettoyer l'intervalle quand le composant est démonté
    return () => clearInterval(interval);
  }, [user]);


  const loadMyBooks = async () => {
    try {
      setLoadingBooks(true);
      const books = await api.getMyBooks();
      setMyBooks(books);
    } catch (error) {
      console.error('Erreur lors du chargement des livres:', error);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.getUnreadNotificationsCount();
      if (response.success) {
        setUnreadCount(response.unreadCount);
      }
    } catch (error) {
      console.error('Erreur chargement compteur:', error);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.\n\nÊtes-vous sûr de vouloir continuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.uuid) {
                await authService.deleteAccount(user.uuid);
                Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
                await logout();
              }
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error.response?.data?.message || 'Impossible de supprimer le compte'
              );
            }
          },
        },
      ]
    );
  };

  const handleBookPress = (bookUuid: string) => {
    // naviguer vers la Stack Books, puis vers BookDetail
    navigation.getParent()?.navigate('Livres', {
      screen: 'BookDetail',
      params: { bookUuid }
    });
  };


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>
      {user && (
        <TouchableOpacity
          style={styles.notificationsButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.notificationButtonContent}>
            <Text style={styles.notificationsButtonText}>🔔 Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

      )}

      {user && (
        <>
          {/* Email (toujours présent) */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          {/* Si infosUser existe, afficher les infos */}
          {user.infosUser ? (
            <>
              <View style={styles.infoContainer}>
                <Text style={styles.label}>Nom d'utilisateur</Text>
                <Text style={styles.value}>{user.infosUser.userName}</Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.label}>Téléphone</Text>
                <Text style={styles.value}>{user.infosUser.phoneNumber}</Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.label}>Ville</Text>
                <Text style={styles.value}>{user.infosUser.city}</Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.label}>Date de naissance</Text>
                <Text style={styles.value}>{formatDate(user.infosUser.birthDate)}</Text>
              </View>

              {user.infosUser.bio && (
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>Biographie</Text>
                  <Text style={styles.value}>{user.infosUser.bio}</Text>
                </View>
              )}

              {/* Bouton Modifier */}
              <View style={styles.buttonContainer}>
                <Button
                  title="Modifier mon profil"
                  onPress={() => navigation.navigate('EditProfile')}
                  color="#007AFF"
                />
              </View>
            </>
          ) : (
            /* Si pas d'infosUser, afficher le message et bouton */
            <>
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Votre profil est incomplet
                </Text>
                <Text style={styles.emptySubtext}>
                  Complétez vos informations pour profiter pleinement de Booksinder
                </Text>
              </View>

              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.completeButtonText}>Compléter mon profil</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Bouton Demandes reçues */}
          <TouchableOpacity
            style={styles.exchangesButton}
            onPress={() => navigation.navigate('ReceivedExchanges')}
          >
            <Text style={styles.exchangesButtonText}> Mes Echange</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Favorites' as never)}
          >
            <Text style={styles.menuButtonText}>❤️ Mes favoris</Text>
          </TouchableOpacity>



          {/* Section Mes livres */}
          <View style={styles.booksSection}>
            <Text style={styles.sectionTitle}>Mes livres ({myBooks.length})</Text>

            {loadingBooks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : myBooks.length === 0 ? (
              <View style={styles.emptyBooksContainer}>
                <Text style={styles.noBooksText}>Vous n'avez pas encore ajouté de livres</Text>
              </View>
            ) : (
              myBooks.map((book) => {
                const frontImage = book.images.find((img) => img.type === 'front');
                const imageToShow = frontImage || book.images[0];

                return (
                  <TouchableOpacity
                    key={book.uuid}
                    style={styles.bookCard}
                    onPress={() => handleBookPress(book.uuid)}
                  >
                    {imageToShow ? (
                      <Image
                        source={{ uri: `http://192.168.1.115:8000${imageToShow.imageUrl}` }}
                        style={styles.bookImage}
                      />
                    ) : (
                      <View style={styles.noImagePlaceholder}>
                        <Text style={styles.noImageText}>📚</Text>
                      </View>
                    )}
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>par {book.author}</Text>
                      <Text style={styles.bookLocation}>📍 {book.location}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Bouton Déconnexion (toujours présent) */}
          <View style={styles.buttonContainer}>
            <Button
              title="Se déconnecter"
              onPress={handleLogout}
              color="#d9534f"
            />
          </View>
          {/* Bouton Suppression (toujours présent) */}
          <View style={styles.buttonContainer}>
            <Button
              title="Supprimer mon compte"
              onPress={handleDeleteAccount}
              color="#8B0000"
            />
          </View>

          <View style={{ height: 40 }} />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exchangesButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  exchangesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButtonText : {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  buttonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  booksSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyBooksContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  noBooksText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookImage: {
    width: 100,
    height: 140,
  },
  noImagePlaceholder: {
    width: 100,
    height: 140,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 40,
  },
  bookInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
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
  notificationsButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  notificationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

});

export default ProfileScreen;
