import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
        <Ionicons name="arrow-back" size={28} color="#000" />
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Politique de confidentialité
      </Text>

      <Text style={{ lineHeight: 20, color: '#444' }}>
        {/* Mets ton texte ici (résumé + points clés). */}
        Nous expliquons ici quelles données sont collectées, pourquoi, et comment vous pouvez exercer vos droits.
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
