import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config/apiConfig';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function VerificationScreen({ route, navigation }: any) {
  const { email } = route.params; // Email passé depuis RegisterScreen
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
  // Validation
  if (!code || code.length !== 6) {
    Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
    return;
  }

  setLoading(true);

  try {
    //appeler la nouvelle méthode
    const { token, user } = await authService.verifyAndLogin(email, code);
    
    console.log('Compte activé et connecté !');
    console.log('Token:', token);
    console.log('User:', user);
    
    // Mettre à jour le contexte
    await refreshUser();

// redirige vers EditProfile
Alert.alert(
  'Succès',
  'Compte activé ! Complétez votre profil.',
  [
    {
      text: 'OK',
      onPress: () => {
        // CHANGEMENT : Navigate au lieu de reset
        navigation.navigate('Profil', { 
          screen: 'EditProfile',
          params: { isFirstTime: true }
        });
      }
    }
  ]
);
    
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || 'Une erreur est survenue';
    Alert.alert('Erreur', message);
    console.error('Erreur vérification:', error);
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      {/* Icône Email */}
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={80} color="#4CAF50" />
      </View>

      {/* Titre */}
      <Text style={styles.title}>Vérifiez votre email</Text>

      {/* Sous-titre */}
      <Text style={styles.subtitle}>
        Un code à 6 chiffres a été envoyé à{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>

      {/* Champ code */}
      <TextInput
        style={styles.input}
        placeholder="Entrez le code"
        placeholderTextColor="#999"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      {/* Bouton Vérifier */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Vérifier</Text>
        )}
      </TouchableOpacity>

      {/* Lien "Renvoyer le code" (TODO: Étape 4) */}
      <TouchableOpacity>
        <Text style={styles.link}>Je n'ai pas reçu le code</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  email: {
    fontWeight: 'bold',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    backgroundColor: '#FAFAFA',
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
});
