import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Book } from '../types/Book';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, BASE_URL } from '../config/apiConfig';
import { styles } from './style/ProfileScreen.styles';
import DeleteAccountModal from '../components/DeleteAccountModal';

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
      <DeleteAccountModal
          visible={showPasswordModal}
          password={password}
          styles={styles}
          onChangePassword={setPassword}
          onCancel={() => {
            setShowPasswordModal(false);
            setPassword('');
          }}
          onConfirm={confirmDeleteAccount}
      />
    </ScrollView>
  );
};
export default ProfileScreen;
