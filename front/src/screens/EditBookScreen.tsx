import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { bookService, UpdateBookData, BookCategorie, BookState, ExchangeType } from '../services/bookService';
import { BOOK_CATEGORIES, BOOK_STATES, EXCHANGE_TYPES } from '../constants/bookOptions';
import { Book } from '../types/Book';

type EditBookRouteProp = RouteProp<{ EditBook: { bookUuid: string; book: Book } }, 'EditBook'>;

export default function EditBookScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditBookRouteProp>();
  const { bookUuid, book } = route.params;

  // États pour les champs du formulaire (avec les données du livre)
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [isbn, setIsbn] = useState(book.isbn);
  const [description, setDescription] = useState(book.description);
  const [pages, setPages] = useState(book.pages.toString());
  const [edition, setEdition] = useState(book.edition || '');
  const [location, setLocation] = useState(book.location);
  const [selectedCategories, setSelectedCategories] = useState<BookCategorie[]>(
    book.categorie as BookCategorie[]
  );
  const [selectedState, setSelectedState] = useState<BookState>(book.state);
  const [selectedExchangeTypes, setSelectedExchangeTypes] = useState<ExchangeType[]>(
    book.availableExchangeTypes as ExchangeType[]
  );

  // États pour les images
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);

  // État de chargement
  const [loading, setLoading] = useState(false);

  // Images actuelles du livre
  const currentFrontImage = book.images.find(img => img.type === 'front');
  const currentBackImage = book.images.find(img => img.type === 'back');

  // Sélectionner une image
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

  // Toggle catégorie
  const toggleCategory = (category: BookCategorie) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      if (selectedCategories.length < 5) {
        setSelectedCategories([...selectedCategories, category]);
      } else {
        Alert.alert('Limite atteinte', 'Vous ne pouvez sélectionner que 5 catégories maximum');
      }
    }
  };

  // Toggle type d'échange
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

  // Validation avant soumission
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
      Alert.alert('Erreur', 'Vous devez sélectionner au moins une catégorie');
      return false;
    }

    if (selectedExchangeTypes.length === 0) {
      Alert.alert('Erreur', "Vous devez sélectionner au moins un type d'échange");
      return false;
    }

    return true;
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    setLoading(true);
    const data = {
      userName: userName.trim(),
      phoneNumber: phoneNumber.trim(),
      city: city.trim(),
      birthDate,
      bio: bio.trim() || undefined,
    };

    if (user?.infosUser?.id) {
      // ✅ Modification existante
      await infosUserService.update(user.infosUser.id, data);
      Alert.alert('Succès', 'Profil modifié avec succès !');
    } else {
      // ✅ Première création du profil
      await infosUserService.create(data);
      Alert.alert(
        'Bienvenue !', 
        'Votre profil a été créé avec succès. Vous pouvez maintenant découvrir les livres disponibles.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Redirection vers l'onglet Livres après création
              navigation.navigate('Livres');
            }
          }
        ]
      );
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    await refreshUser();
    
    // ✅ Ne pas utiliser goBack() lors de la première création
    if (user?.infosUser?.id) {
      navigation.goBack();
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
      <Text style={styles.title}>Modifier le livre</Text>

      {/* Titre */}
      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex: Le Petit Prince"
        maxLength={100}
      />

      {/* Auteur */}
      <Text style={styles.label}>Auteur *</Text>
      <TextInput
        style={styles.input}
        value={author}
        onChangeText={setAuthor}
        placeholder="Ex: Antoine de Saint-Exupéry"
        maxLength={100}
      />

      {/* ISBN */}
      <Text style={styles.label}>ISBN *</Text>
      <TextInput
        style={styles.input}
        value={isbn}
        onChangeText={setIsbn}
        placeholder="Ex: 978-2-07-061275-8"
        maxLength={20}
      />

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez le livre..."
        multiline
        numberOfLines={4}
        maxLength={5000}
      />

      {/* Pages */}
      <Text style={styles.label}>Nombre de pages *</Text>
      <TextInput
        style={styles.input}
        value={pages}
        onChangeText={setPages}
        placeholder="Ex: 96"
        keyboardType="numeric"
      />

      {/* Édition */}
      <Text style={styles.label}>Édition (optionnel)</Text>
      <TextInput
        style={styles.input}
        value={edition}
        onChangeText={setEdition}
        placeholder="Ex: Édition de luxe 2020"
        maxLength={40}
      />

      {/* Localisation */}
      <Text style={styles.label}>Localisation *</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Ex: Paris 75001"
        maxLength={50}
      />

      {/* État du livre */}
      <Text style={styles.label}>État du livre *</Text>
      <View style={styles.optionsContainer}>
        {BOOK_STATES.map((state) => (
          <TouchableOpacity
            key={state.value}
            style={[styles.optionButton, selectedState === state.value && styles.optionButtonSelected]}
            onPress={() => setSelectedState(state.value)}
          >
            <Text style={[styles.optionText, selectedState === state.value && styles.optionTextSelected]}>
              {state.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Catégories */}
      <Text style={styles.label}>Catégories * (1 à 5)</Text>
      <View style={styles.optionsContainer}>
        {BOOK_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.optionButton, selectedCategories.includes(cat.value) && styles.optionButtonSelected]}
            onPress={() => toggleCategory(cat.value)}
          >
            <Text
              style={[styles.optionText, selectedCategories.includes(cat.value) && styles.optionTextSelected]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Types d'échange */}
      <Text style={styles.label}>Types d'échange * (1 à 3)</Text>
      <View style={styles.optionsContainer}>
        {EXCHANGE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.optionButton,
              selectedExchangeTypes.includes(type.value) && styles.optionButtonSelected,
            ]}
            onPress={() => toggleExchangeType(type.value)}
          >
            <Text
              style={[styles.optionText, selectedExchangeTypes.includes(type.value) && styles.optionTextSelected]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Images */}
      <Text style={styles.label}>Images</Text>

      {/* Image front */}
      <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage('front')}>
        <Text style={styles.imagePickerText}>📷 Changer l'image de couverture (avant)</Text>
      </TouchableOpacity>
      {frontImageUri ? (
        <Image source={{ uri: frontImageUri }} style={styles.imagePreview} />
      ) : currentFrontImage ? (
        <Image
          source={{ uri: `http://192.168.1.115:8000${currentFrontImage.imageUrl}` }}
          style={styles.imagePreview}
        />
      ) : null}

      {/* Image back */}
      <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickImage('back')}>
        <Text style={styles.imagePickerText}>📷 Changer l'image de couverture (arrière)</Text>
      </TouchableOpacity>
      {backImageUri ? (
        <Image source={{ uri: backImageUri }} style={styles.imagePreview} />
      ) : currentBackImage ? (
        <Image
          source={{ uri: `http://192.168.1.115:8000${currentBackImage.imageUrl}` }}
          style={styles.imagePreview}
        />
      ) : null}

      {/* Bouton de soumission */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  imagePickerButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
