import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      Alert.alert('Succès', 'Connexion réussie !');
      navigation.navigate('Profil');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
  <Image
    source={require('../../assets/images/connexion-image.png')}
    style={styles.illustration}
    resizeMode="contain"
  />
</View>


      {/* Texte d'accroche */}
      <Text style={styles.catchPhrase}>
        Prêt à te lancer dans une quête{'\n'}d'inspiration et de savoir ?
      </Text>

      {/* Titre */}
      <Text style={styles.title}>Connexion</Text>

      {/* Message d'erreur */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Champ Email */}
      <TextInput
        style={styles.input}
        placeholder="email@domain.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Champ Mot de passe avec icône œil */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Bouton Sign up */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Connexion...' : 'Sign up'}
        </Text>
      </TouchableOpacity>

      {/* Liens */}
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>S'inscrire ?</Text>
      </TouchableOpacity>

      {/* Séparateur */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>ou</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Boutons OAuth */}
      <TouchableOpacity style={styles.oauthButton}>
        <Text style={styles.googleIcon}>G</Text>
        <Text style={styles.oauthText}>Continuer avec Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.oauthButton}>
        <Ionicons name="logo-apple" size={20} color="#000" />
        <Text style={styles.oauthText}>Continuer avec Apple</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illustration: {
    width: 300,
    height: 220,
  },
  illustrationPlaceholder: {
    width: 250,
    height: 200,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationEmoji: {
    fontSize: 80,
  },

  // Texte d'accroche
  catchPhrase: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  // Titre
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#000',
  },

  // Erreur
  error: {
    color: '#FF3B30',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },

  // Champs de texte
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },

  // Champ mot de passe avec icône
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },

  // Bouton principal
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Liens
  link: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },

  // Séparateur "ou"
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 14,
  },

  // Boutons OAuth
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#4285F4',
  },
  oauthText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
});
