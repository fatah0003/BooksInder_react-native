import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config/apiConfig';

export default function RegisterScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    

    const { login } = useAuth();

    const handleRegister = async () => {
        // Vérifications basiques
        if (!email || !password || !confirmPassword) {
            Alert.alert('Erreur', 'Tous les champs sont obligatoires');
            return;
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Erreur', "L'email n'est pas valide");
            return;
        }

        if (email.length > 180) {
            Alert.alert('Erreur', "L'email ne peut pas dépasser 180 caractères");
            return;
        }

        // Validation mot de passe
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (!/[A-Z]/.test(password)) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins une lettre majuscule');
            return;
        }

        if (!/[a-z]/.test(password)) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins une lettre minuscule');
            return;
        }

        if (!/[0-9]/.test(password)) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins un chiffre');
            return;
        }

        if (!/[\W_]/.test(password)) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins un caractère spécial');
            return;
        }

        setLoading(true);

        try {
            // Appel API d'inscription
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
      // CONNEXION AUTOMATIQUE
      await login(email, password);
      
      // ATTENDRE UN PEU QUE LE STATE SE METTE À JOUR
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // REDIRECTION VERS EDITPROFILE
      navigation.navigate('Profil', {
        screen: 'EditProfile'
      });

            } else {
                console.log('Erreur backend:', data);

                let errorMessage = data.error
                    || data.message
                    || data.detail
                    || data.violations?.[0]?.message
                    || 'Une erreur est survenue';

                // Traduction en français
                if (errorMessage === 'Email already used.') {
                    errorMessage = 'Cet email est déjà utilisé';
                }

                Alert.alert('Erreur', errorMessage);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message
                || error.message
                || 'Une erreur est survenue';

            Alert.alert('Erreur', errorMsg);
            console.error('Erreur inscription:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Bouton retour */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={28} color="#000" />
            </TouchableOpacity>

            {/* Titre */}
            <Text style={styles.title}>Créer un compte</Text>

            {/* Sous-titre */}
            <Text style={styles.subtitle}>Pret à te lancer dans une quête de de savoir ?</Text>

            {/* Champ Email */}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {/* Champ Mot de passe */}
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

            {/* Champ Confirmer mot de passe */}
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={22}
                        color="#999"
                    />
                </TouchableOpacity>
            </View>


            {/* Bouton S'inscrire */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>S'inscrire</Text>
                )}
            </TouchableOpacity>

            {/* Lien "Déjà un compte" */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Déjà un compte ? se connecter</Text>
            </TouchableOpacity>

            {/* Conditions d'utilisation */}
            <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                    En cliquant sur S'inscrire, vous{'\n'}
                    acceptez nos <Text style={styles.termsLink}>Conditions d'utilisation</Text>{'\n'}
                    et notre <Text style={styles.termsLink}>Politique de confidentialité</Text>
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingTop: 100,
        paddingBottom: 30,
    },


    // Bouton retour
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
        zIndex: 10,
    },

    // Titre
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#000',
    },

    // Sous-titre
    subtitle: {
        fontSize: 16,
        color: '#999',
        marginBottom: 35,
    },

    // Champ de texte simple
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
        marginBottom: 25,
    },

    // Champ mot de passe avec icône
    passwordContainer: {
        marginBottom: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        backgroundColor: '#FAFAFA',
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
        marginTop: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Lien
    link: {
        color: '#007AFF',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 50,
    },

    // Conditions d'utilisation
    termsContainer: {
        marginTop: 20,
    },
    termsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
});
