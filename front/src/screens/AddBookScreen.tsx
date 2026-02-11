import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { bookService, CreateBookData, BookCategorie, BookState, ExchangeType } from '../services/bookService';
import { BOOK_CATEGORIES, BOOK_STATES, EXCHANGE_TYPES } from '../constants/bookOptions';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddBookScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // états pour les champs du formulaire
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [pages, setPages] = useState('');
  const [edition, setEdition] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<BookCategorie[]>([]);
  const [selectedState, setSelectedState] = useState<BookState | null>(null);
  const [selectedExchangeTypes, setSelectedExchangeTypes] = useState<ExchangeType[]>([]);

  // états pour les modales
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // états pour les images
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);

  // état de chargement
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // ✅ VÉRIFICATION DU PROFIL AU CHARGEMENT
  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        navigation.goBack();
        return;
      }

      const currentUser = JSON.parse(userStr);

      // ✅ Vérifier si le profil est complet
      const hasUserName = currentUser.infosUser?.userName;
      const hasCity = currentUser.infosUser?.city;
      const hasPhoneNumber = currentUser.infosUser?.phoneNumber;
      const hasBirthDate = currentUser.infosUser?.birthDate;

      const isProfileComplete = hasUserName && hasCity && hasPhoneNumber && hasBirthDate;

      if (!isProfileComplete) {
        Alert.alert(
          'Profil incomplet',
          'Pour ajouter un livre, vous devez d\'abord compléter votre profil (nom d\'utilisateur, ville, téléphone et date de naissance).',
          [
            {
              text: 'Compléter mon profil',
              onPress: () => {
                // Navigation vers le ProfileStack puis EditProfile
                navigation.getParent()?.navigate('Profil', {
                  screen: 'EditProfile'
                });
              },
            },

            {
              text: 'Plus tard',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      setCheckingProfile(false);

    } catch (error: any) {
      console.warn('⚠️ Erreur vérification profil:', error.message);
      Alert.alert('Erreur', 'Impossible de vérifier votre profil');
      navigation.goBack();
    }
  };

  // sélectionner une image
  const pickImage = async (type: 'front' | 'back') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission refusée', "L'accès à la galerie est requis");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'front') {
        setFrontImageUri(result.assets[0].uri);
      } else {
        setBackImageUri(result.assets[0].uri);
      }
    }
  };

  // catégorie (une seule)
  const selectCategory = (category: BookCategorie) => {
    setSelectedCategories([category]);
    setShowCategoryModal(false);
  };

  // type d'échange
  const toggleExchangeType = (type: ExchangeType) => {
    if (selectedExchangeTypes.includes(type)) {
      setSelectedExchangeTypes(selectedExchangeTypes.filter((t) => t !== type));
    } else {
      if (selectedExchangeTypes.length < 3) {
        setSelectedExchangeTypes([...selectedExchangeTypes, type]);
      } else {
        Alert.alert('Limite atteinte', 'Vous ne pouvez sélectionner que 3 types maximum');
      }
    }
  };

  // validation avant soumission
  const validateForm = (): boolean => {
    if (!title.trim() || title.length > 100) {
      Alert.alert('Erreur', 'Le titre est requis (max 100 caractères)');
      return false;
    }

    if (!author.trim() || author.length < 2 || author.length > 100) {
      Alert.alert('Erreur', "L'auteur doit faire entre 2 et 100 caractères");
      return false;
    }

    if (!isbn.trim() || isbn.length > 20) {
      Alert.alert('Erreur', "L'ISBN est requis (max 20 caractères)");
      return false;
    }

    if (!description.trim() || description.length < 10 || description.length > 5000) {
      Alert.alert('Erreur', 'La description doit faire entre 10 et 5000 caractères');
      return false;
    }

    const pagesNum = parseInt(pages, 10);
    if (isNaN(pagesNum) || pagesNum < 1 || pagesNum > 10000) {
      Alert.alert('Erreur', 'Le nombre de pages doit être entre 1 et 10000');
      return false;
    }

    if (edition && edition.length > 40) {
      Alert.alert('Erreur', "L'édition ne peut pas dépasser 40 caractères");
      return false;
    }

    if (!location.trim() || location.length < 2 || location.length > 50) {
      Alert.alert('Erreur', 'La localisation doit faire entre 2 et 50 caractères');
      return false;
    }

    if (selectedCategories.length === 0) {
      Alert.alert('Erreur', 'Vous devez sélectionner une catégorie');
      return false;
    }

    if (!selectedState) {
      Alert.alert('Erreur', "Vous devez sélectionner un état du livre");
      return false;
    }

    if (selectedExchangeTypes.length === 0) {
      Alert.alert('Erreur', "Vous devez sélectionner au moins un type d'échange");
      return false;
    }

    return true;
  };

  // soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const bookData: CreateBookData = {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        description: description.trim(),
        pages: parseInt(pages, 10),
        edition: edition.trim() || undefined,
        location: location.trim(),
        categorie: selectedCategories,
        state: selectedState!,
        availableExchangeTypes: selectedExchangeTypes,
      };

      const createdBook = await bookService.create(bookData);

      if (frontImageUri) {
        await bookService.uploadCoverFront(createdBook.uuid, frontImageUri);
      }

      if (backImageUri) {
        await bookService.uploadCoverBack(createdBook.uuid, backImageUri);
      }

      Alert.alert('Succès', 'Le livre a été ajouté avec succès !', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la création du livre:', error);

      // ✅ Extraction détaillée de l'erreur
      let errorMessage = 'Une erreur est survenue';

      if (error.response?.data) {
        const data = error.response.data;

        // Si l'erreur contient un message direct
        if (data.message) {
          errorMessage = data.message;
        }
        // Si l'erreur contient des violations de contraintes (Symfony)
        else if (data.violations && Array.isArray(data.violations)) {
          errorMessage = data.violations
            .map((v: any) => `${v.propertyPath}: ${v.message}`)
            .join('\n');
        }
        // Si l'erreur contient un tableau d'erreurs
        else if (data.errors) {
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join('\n');
          } else if (typeof data.errors === 'object') {
            errorMessage = Object.entries(data.errors)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
          }
        }
        // Si l'erreur contient un détail
        else if (data.detail) {
          errorMessage = data.detail;
        }
      }

      // Affichage de l'erreur à l'utilisateur
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Afficher un loader pendant la vérification du profil
  if (checkingProfile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Vérification du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/images/image-ajout-form.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Ajouter un Livre</Text>

      {/* ISBN */}
      <Text style={styles.label}>ISBN *</Text>
      <TextInput
        style={styles.input}
        value={isbn}
        onChangeText={setIsbn}
        placeholder="Ex : 1524759783"
        placeholderTextColor="#CCC"
        maxLength={20}
      />

      {/* Titre */}
      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex : Récursion"
        placeholderTextColor="#CCC"
        maxLength={100}
      />

      {/* Auteur */}
      <Text style={styles.label}>Auteur *</Text>
      <TextInput
        style={styles.input}
        value={author}
        onChangeText={setAuthor}
        placeholder="Ex : BLAKE Crouche"
        placeholderTextColor="#CCC"
        maxLength={100}
      />

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez le livre..."
        placeholderTextColor="#CCC"
        multiline
        numberOfLines={4}
        maxLength={5000}
      />

      {/* Pages */}
      <Text style={styles.label}>Nb Pages *</Text>
      <TextInput
        style={styles.input}
        value={pages}
        onChangeText={setPages}
        placeholder="Ex : 296"
        placeholderTextColor="#CCC"
        keyboardType="numeric"
      />

      {/* Édition */}
      <Text style={styles.label}>Édition</Text>
      <TextInput
        style={styles.input}
        value={edition}
        onChangeText={setEdition}
        placeholder="Ex : Édition de luxe 2020"
        placeholderTextColor="#CCC"
        maxLength={40}
      />

      {/* Localisation */}
      <Text style={styles.label}>Localisation *</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Ex : Lyon 69008"
        placeholderTextColor="#CCC"
        maxLength={50}
      />

      {/* État du livre - DROPDOWN */}
      <Text style={styles.label}>État du livre *</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowStateModal(true)}
      >
        <Text style={[styles.selectButtonText, !selectedState && styles.placeholderText]}>
          {selectedState
            ? BOOK_STATES.find(s => s.value === selectedState)?.label
            : 'Neuf'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {/* Catégorie - DROPDOWN */}
      <Text style={styles.label}>Catégorie</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={[styles.selectButtonText, selectedCategories.length === 0 && styles.placeholderText]}>
          {selectedCategories.length > 0
            ? BOOK_CATEGORIES.find(c => c.value === selectedCategories[0])?.label
            : 'Science-Fiction'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {/* Types d'échange avec checkboxes */}
      <Text style={styles.label}>Type(s) d'échange(s) souhaité(s) *</Text>
      <View style={styles.checkboxContainer}>
        {EXCHANGE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={styles.checkboxRow}
            onPress={() => toggleExchangeType(type.value)}
          >
            <Ionicons
              name={selectedExchangeTypes.includes(type.value) ? 'checkbox' : 'square-outline'}
              size={24}
              color={selectedExchangeTypes.includes(type.value) ? '#007AFF' : '#999'}
            />
            <Text style={styles.checkboxLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Images */}
      <Text style={styles.label}>Images</Text>

      {/* Image front */}
      <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage('front')}>
        <Text style={styles.imagePickerText}>Image de couverture avant</Text>
        <Ionicons name="camera" size={24} color="#666" />
      </TouchableOpacity>
      {frontImageUri && <Image source={{ uri: frontImageUri }} style={styles.imagePreview} />}

      {/* Image back */}
      <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage('back')}>
        <Text style={styles.imagePickerText}>Image de couverture arrière</Text>
        <Ionicons name="camera" size={24} color="#666" />
      </TouchableOpacity>
      {backImageUri && <Image source={{ uri: backImageUri }} style={styles.imagePreview} />}

      {/* Bouton de soumission */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Ajouter le livre</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 150 }} />

      {/* Modal État du livre */}
      <Modal
        visible={showStateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>État du livre</Text>
            {BOOK_STATES.map((state) => (
              <TouchableOpacity
                key={state.value}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedState(state.value);
                  setShowStateModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{state.label}</Text>
                {selectedState === state.value && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStateModal(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Catégorie */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Catégorie</Text>
            {BOOK_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={styles.modalOption}
                onPress={() => selectCategory(cat.value)}
              >
                <Text style={styles.modalOptionText}>{cat.label}</Text>
                {selectedCategories.includes(cat.value) && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#000',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    padding: 15,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#CCC',
  },
  checkboxContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  imagePickerButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imagePickerText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  illustration: {
    width: 250,
    height: 180,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalCloseButton: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  modalCloseText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
