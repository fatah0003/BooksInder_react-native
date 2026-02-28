import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Conditions d’utilisation
      </Text>

      <Text style={{ lineHeight: 20, color: '#444' }}>
        {/* Mets ton texte ici */}
        Ces conditions définissent les règles d’utilisation de Booksinder (compte, échanges, contenu, etc.).
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
