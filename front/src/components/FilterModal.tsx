import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { styles } from '../screens/style/BookListScreen.styles';
import { BOOK_CATEGORIES, BOOK_STATES, EXCHANGE_TYPES } from '../constants/bookOptions';

type FilterType = 'location' | 'category' | 'exchange' | 'state';

interface Props {
  visible: boolean;
  activeFilterType: FilterType | null;
  tempLocationInput: string;
  onLocationChange: (val: string) => void;
  onApply: (type: string, value: string) => void;
  onClose: () => void;
}

export default function FilterModal({
  visible,
  activeFilterType,
  tempLocationInput,
  onLocationChange,
  onApply,
  onClose,
}: Props) {

  const renderContent = () => {
    if (activeFilterType === 'location') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir une ville</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Entrez une ville..."
            value={tempLocationInput}
            onChangeText={onLocationChange}
            autoFocus
          />
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => tempLocationInput && onApply('location', tempLocationInput)}
          >
            <Text style={styles.applyButtonText}>Appliquer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeFilterType === 'category') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir une catégorie</Text>
          <ScrollView style={styles.optionsList}>
            {BOOK_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={styles.filterOption}
                onPress={() => onApply('category', cat.value)}
              >
                <Text style={styles.filterOptionText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeFilterType === 'exchange') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Type d'échange</Text>
          {EXCHANGE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={styles.filterOption}
              onPress={() => onApply('exchange', type.value)}
            >
              <Text style={styles.filterOptionText}>{type.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeFilterType === 'state') {
      return (
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>État du livre</Text>
          <ScrollView style={styles.optionsList}>
            {BOOK_STATES.map((state) => (
              <TouchableOpacity
                key={state.value}
                style={styles.filterOption}
                onPress={() => onApply('state', state.value)}
              >
                <Text style={styles.filterOptionText}>{state.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}