import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
            const response = await fetch('http://192.168.1.115:8000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Succès', 'Inscription réussie ! Connexion en cours...');
                // Après l'inscription, on connecte directement l'utilisateur
                await login(email, password);
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
        <View style={styles.container}>
            <Text style={styles.title}>Créer un compte</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

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

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    link: {
        color: '#007AFF',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});
