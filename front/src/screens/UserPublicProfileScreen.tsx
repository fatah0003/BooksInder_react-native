import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { UserPublicProfileData } from '../types/UserPublicProfile';
import { API_URL, BASE_URL } from '../config/apiConfig';

type UserPublicProfileRouteProp = RouteProp<{ UserPublicProfile: { userUuid: string } }, 'UserPublicProfile'>;

export default function UserPublicProfileScreen() {
  const route = useRoute<UserPublicProfileRouteProp>();
  const navigation = useNavigation();
  const { userUuid } = route.params;

  const [data, setData] = useState<UserPublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profileData = await api.getUserPublicProfile(userUuid);
      console.log('👤 Profil public:', JSON.stringify(profileData, null, 2));
      setData(profileData);
    } catch (err: any) {
      console.error('Erreur:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (bookUuid: string) => {
    navigation.navigate('BookDetail' as never, { bookUuid } as never);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur : {error || 'Profil introuvable'}</Text>
      </View>
    );
  }

  const { user, books } = data;

  return (
    <ScrollView style={styles.container}>
      {/* Informations utilisateur */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user.infosUser?.userName?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>

        {user.infosUser ? (
          <>
            <Text style={styles.username}>@{user.infosUser.userName}</Text>
            <Text style={styles.city}>📍 {user.infosUser.city}</Text>
            {user.infosUser.bio && (
              <Text style={styles.bio}>{user.infosUser.bio}</Text>
            )}
          </>
        ) : (
          <Text style={styles.noInfo}>Profil non complété</Text>
        )}
      </View>

      <View style={styles.separator} />

      {/* Livres de l'utilisateur */}
      <View style={styles.booksSection}>
        <Text style={styles.sectionTitle}>
          Livres publiés ({books.length})
        </Text>

        {books.length === 0 ? (
          <Text style={styles.noBooksText}>Aucun livre publié pour le moment</Text>
        ) : (
          books.map((book) => {
            const frontImage = book.images.find((img) => img.type === 'front');
            const imageToShow = frontImage || book.images[0];

            return (
              <TouchableOpacity
                key={book.uuid}
                style={styles.bookCard}
                onPress={() => handleBookPress(book.uuid)}
              >
                {imageToShow && (
                  <Image
                    source={{ uri: `${BASE_URL}${imageToShow.imageUrl}` }}
                    style={styles.bookImage}
                  />
                )}
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>par {book.author}</Text>
                  <Text style={styles.bookLocation}>📍 {book.location}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    padding: 20,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  city: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  noInfo: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  booksSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  noBooksText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  bookImage: {
    width: 100,
    height: 140,
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
