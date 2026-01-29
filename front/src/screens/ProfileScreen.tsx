import React from 'react';
import { View, Text, StyleSheet, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();

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
      '⚠️ Supprimer le compte',
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


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon Profil</Text>

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
  buttonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
});

export default ProfileScreen;
