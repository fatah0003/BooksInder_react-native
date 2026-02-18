import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Book } from '../types/Book';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, BASE_URL } from '../config/apiConfig';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadMyBooks();
      loadUnreadCount();
    }, [])
  );

  useEffect(() => {
    if (!user) return;

    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadMyBooks = async () => {
    try {
      setLoadingBooks(true);
      const books = await api.getMyBooks();
      setMyBooks(books);
    } catch (error: any) {
      // Silencieux si 401
      if (error.response?.status !== 401) {
        console.warn('Erreur chargement livres:', error.message);
      }
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
    } catch (error: any) {
      // Silencieux si 401
      if (error.response?.status !== 401) {
        console.warn('Erreur chargement compteur notifications:', error.message);
      }
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
        text: 'Continuer',
        style: 'destructive',
        onPress: () => {
          // Ouvrir le modal pour demander le mot de passe
          setShowPasswordModal(true);
        },
      },
    ]
  );
};

const confirmDeleteAccount = async () => {
  // Vérifier que le mot de passe n'est pas vide
  if (!password || password.trim() === '') {
    Alert.alert('Erreur', 'Le mot de passe est requis');
    return;
  }

  try {
    if (user?.uuid) {
      // Fermer le modal
      setShowPasswordModal(false);
      
      // Supprimer le compte avec le mot de passe
      await authService.deleteAccount(user.uuid, password);
      
      // Réinitialiser le champ mot de passe
      setPassword('');
      
      Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
      await logout();
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Impossible de supprimer le compte';
    Alert.alert('Erreur', errorMessage);
    
    // Réinitialiser le mot de passe en cas d'erreur
    setPassword('');
  }
};

  const handleBookPress = (bookUuid: string) => {
    navigation.getParent()?.navigate('Livres', {
      screen: 'BookDetail',
      params: { bookUuid }
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec boutons retour et notification */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={28} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/images/profil-user.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {user && (
        <>
          {/* Infos utilisateur */}
          <View style={styles.userInfoSection}>
            <View style={styles.mainRow}>
              {/* Colonne gauche : Infos */}
              <View style={styles.leftColumn}>
                {/* Email */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                  </View>
                  <Text style={styles.infoText}>{user.email}</Text>
                </View>

                {/* Localisation */}
                {user.infosUser && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="location-outline" size={20} color="#666" />
                    </View>
                    <Text style={styles.infoText}>{user.infosUser.city || 'Lyon, France'}</Text>
                  </View>
                )}

                {/* Téléphone */}
                {user.infosUser && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="call-outline" size={20} color="#666" />
                    </View>
                    <Text style={styles.infoText}>{user.infosUser.phoneNumber || '0662xxxxxx'}</Text>
                  </View>
                )}

                {/* Date de naissance */}
                {user.infosUser && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </View>
                    <Text style={styles.infoText}>
                      {user.infosUser.birthDate ? formatDate(user.infosUser.birthDate) : '03/03/2033'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Colonne droite : me + Bio */}
              <View style={styles.rightColumn}>
                <View style={styles.meRow}>
                  <Ionicons name="person-circle" size={20} color="#666" style={styles.meIcon} />
                  <Text style={styles.bioLabel}>Biographie</Text>
                </View>

                {user.infosUser?.bio ? (
                  <Text style={styles.bioContent} numberOfLines={6}>
                    {user.infosUser.bio}
                  </Text>
                ) : (
                  <Text style={styles.bioPlaceholder}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec.
                  </Text>
                )}
              </View>
            </View>
          </View>



          {/* Bouton Modifier mon Profil */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.primaryButtonText}>Modifier mon Profil</Text>
          </TouchableOpacity>

          {/* Bouton Historique des échanges */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ReceivedExchanges')}
          >
            <Text style={styles.secondaryButtonText}>Historique des échanges</Text>
          </TouchableOpacity>

          {/* Bouton Mes Favoris */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Favorites' as never)}
          >
            <Text style={styles.secondaryButtonText}>Mes Favoris</Text>
          </TouchableOpacity>

          {/* Section Mes livres */}
          <View style={styles.booksSection}>
            <Text style={styles.sectionTitle}>Mes livres ({myBooks.length})</Text>

            {loadingBooks ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : myBooks.length === 0 ? (
              <View style={styles.emptyBooksContainer}>
                <Text style={styles.noBooksText}>Vous n'avez pas encore ajouté de livres</Text>
              </View>
            ) : (
              <View style={styles.booksGrid}>
                {myBooks.map((book) => {
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
                          source={{ uri: `${BASE_URL}${imageToShow.imageUrl}` }}
                          style={styles.bookImage}
                        />
                      ) : (
                        <View style={styles.noImagePlaceholder}>
                          <View style={styles.iconCircle}>
                            <Ionicons name="book-outline" size={56} color="#47769d" />
                          </View>
                        </View>
                      )}
                      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                      <Text style={styles.bookLocation}>{book.location}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          <View style={styles.divider} />

          {/* Bouton Se déconnecter */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>

          {/* Bouton Supprimer mon compte */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </>
      )}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPassword('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmation requise</Text>
            <Text style={styles.modalDescription}>
              Pour supprimer votre compte, veuillez entrer votre mot de passe :
            </Text>
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Mot de passe"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelModalButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteModalButton}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.deleteModalButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 50,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  notificationIcon: {
    padding: 5,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illustration: {
    width: 200,
    height: 150,
  },

  // Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Infos utilisateur
  userInfoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FAFAFA',
  },

  // Row principale avec 2 colonnes
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Colonne gauche (infos)
  leftColumn: {
    flex: 1,
    paddingRight: 15,
  },

  // Colonne droite (bio)
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },

  // Me + Biographie
  meText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  bioLabel: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#666',
  },
  bioContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  bioPlaceholder: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Row pour chaque info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },


  // Row pour email + me/bio
  emailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  emailLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },

  // Container me + bio à droite
  meAndBioContainer: {
    flex: 1,
    marginLeft: 10,
  },
  // Row normale pour les autres infos

  meTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  meTagText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  bioText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  bioContainer: {
    marginLeft: 44,
    marginTop: -10,
    marginBottom: 15,
  },
  bioTextContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Boutons
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Section livres
  booksSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
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
    backgroundColor: '#F5F5F5',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  noBooksText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },

  // Grille de livres (2 colonnes)
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookCard: {
    width: '48%',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookImage: {
    width: '100%',
    height: 200,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 50,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  bookAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  bookLocation: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 5,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#eaebf0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  // Me row avec icône
  meRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meIcon: {
    marginRight: 6,
  },
  // Trait séparateur
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
