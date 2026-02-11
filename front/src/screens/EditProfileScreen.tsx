import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { infosUserService } from '../services/infosUserService';


export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();

  // FONCTIONS DE CONVERSION
  const convertISOtoFR = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const convertFRtoISO = (frDate: string): string => {
    const parts = frDate.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Préremplir avec les données initiales
  const [userName, setUserName] = useState(user?.infosUser?.userName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.infosUser?.phoneNumber || '');
  const [city, setCity] = useState(user?.infosUser?.city || '');

  // AFFICHAGE EN FORMAT FRANÇAIS
  const [birthDate, setBirthDate] = useState(
    user?.infosUser?.birthDate ? convertISOtoFR(user.infosUser.birthDate) : ''
  );

  const [bio, setBio] = useState(user?.infosUser?.bio || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // AUTO-FORMATAGE DE LA DATE PENDANT LA SAISIE
  const handleBirthDateChange = (text: string) => {
    // Supprimer tout sauf les chiffres
    let cleaned = text.replace(/\D/g, '');

    // Limiter à 8 chiffres (JJMMAAAA)
    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }

    // Ajouter les slashes automatiquement
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length >= 5) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4) + '/' + cleaned.substring(4);
    }

    setBirthDate(formatted);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // UserName
    if (!userName.trim()) {
      newErrors.userName = 'Le nom d\'utilisateur est requis';
    } else if (userName.length < 2 || userName.length > 30) {
      newErrors.userName = 'Entre 2 et 30 caractères';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(userName)) {
      newErrors.userName = 'Lettres, chiffres, tirets et underscores uniquement';
    }

    // Phone
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le téléphone est requis';
    } else if (!/^(\+33|0)[1-9](\d{8})$/.test(phoneNumber)) {
      newErrors.phoneNumber = 'Numéro français invalide (ex: 0612345678)';
    }

    // City
    if (!city.trim()) {
      newErrors.city = 'La ville est requise';
    } else if (city.length < 2 || city.length > 50) {
      newErrors.city = 'Entre 2 et 50 caractères';
    }

    // VALIDATION FORMAT FRANÇAIS JJ/MM/AAAA
    if (!birthDate.trim()) {
      newErrors.birthDate = 'La date de naissance est requise';
    } else {
      // Vérifier le format JJ/MM/AAAA
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = birthDate.match(dateRegex);

      if (!match) {
        newErrors.birthDate = 'Format invalide (JJ/MM/AAAA)';
      } else {
        const [_, day, month, year] = match;
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Vérifier que les valeurs sont dans les plages valides
        if (monthNum < 1 || monthNum > 12) {
          newErrors.birthDate = 'Mois invalide (01-12)';
        } else if (dayNum < 1 || dayNum > 31) {
          newErrors.birthDate = 'Jour invalide (01-31)';
        } else {
          // Créer la date et vérifier qu'elle est valide
          const date = new Date(yearNum, monthNum - 1, dayNum);

          // Vérifier que la date créée correspond bien aux valeurs saisies
          if (
            date.getDate() !== dayNum ||
            date.getMonth() !== monthNum - 1 ||
            date.getFullYear() !== yearNum
          ) {
            newErrors.birthDate = 'Date invalide';
          } else {
            // Vérifier l'âge
            const now = new Date();
            const age = now.getFullYear() - date.getFullYear();
            const monthDiff = now.getMonth() - date.getMonth();
            const dayDiff = now.getDate() - date.getDate();

            let finalAge = age;
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
              finalAge--;
            }

            if (finalAge < 13) {
              newErrors.birthDate = 'Vous devez avoir au moins 13 ans';
            } else if (finalAge > 120) {
              newErrors.birthDate = 'Âge invalide';
            }
          }
        }
      }
    }

    // Bio 
    if (bio && bio.length > 1000) {
      newErrors.bio = 'Maximum 1000 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // CONVERSION EN ISO AVANT ENVOI API
      const data = {
        userName: userName.trim(),
        phoneNumber: phoneNumber.trim(),
        city: city.trim(),
        birthDate: convertFRtoISO(birthDate), // ← CONVERSION ICI
        bio: bio.trim() || undefined,
      };

      if (user?.infosUser?.id) {
        // Modification du profil existant
        await infosUserService.update(user.infosUser.id, data);
        Alert.alert('Succès', 'Profil modifié avec succès !');

        // Attendre 500ms pour que la BDD se mette à jour
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshUser();
        navigation.goBack();

      } else {
  // Première création du profil
  await infosUserService.create(data);
  
  Alert.alert(
    'Profil complété ! ',
    'Votre profil est à jour. Vous pouvez maintenant profiter de toutes les fonctionnalités de l\'application.',
    [
      {
        text: 'Compris',
        onPress: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          await refreshUser();
          navigation.goBack();
        }
      }
    ]
  );
}


    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Une erreur est survenue'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {user?.infosUser ? 'Modifier mon profil' : 'Compléter mon profil'}
      </Text>

      {/* UserName */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom d'utilisateur *</Text>
        <TextInput
          style={[styles.input, errors.userName && styles.inputError]}
          placeholder="ex: john_doe"
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="none"
        />
        {errors.userName && <Text style={styles.errorText}>{errors.userName}</Text>}
      </View>

      {/* Phone */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Téléphone *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="ex: 0612345678"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      {/* City */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ville *</Text>
        <TextInput
          style={[styles.input, errors.city && styles.inputError]}
          placeholder="ex: Paris"
          value={city}
          onChangeText={setCity}
        />
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
      </View>

      {/* BirthDate EN FORMAT FRANÇAIS AVEC AUTO-FORMATAGE */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date de naissance * (JJ/MM/AAAA)</Text>
        <TextInput
          style={[styles.input, errors.birthDate && styles.inputError]}
          placeholder="ex: 15/01/1990"
          value={birthDate}
          onChangeText={handleBirthDateChange}
          keyboardType="numeric"
          maxLength={10}
        />
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
      </View>

      {/* Bio */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Biographie</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
          placeholder="Parlez de vous..."
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />
        <Text style={styles.charCount}>{bio.length}/1000</Text>
        {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
      </View>

      {/* Boutons */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#d9534f',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#d9534f',
    fontSize: 12,
    marginTop: 5,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
