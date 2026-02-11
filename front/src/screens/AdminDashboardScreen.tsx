import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuth();

  const adminSections = [
    {
      title: 'Gestion des utilisateurs',
      icon: 'people',
      screen: 'AdminUsers',
      description: 'Voir et supprimer des utilisateurs',
      color: '#3B82F6',
    },
    {
      title: 'Gestion des livres',
      icon: 'book',
      screen: 'AdminBooks',
      description: 'Modifier ou supprimer des livres',
      color: '#10B981',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color="#3B82F6" />
        <Text style={styles.headerTitle}>Espace Administration</Text>
        <Text style={styles.subheader}>Connecté en tant que {user?.email}</Text>
      </View>

      {adminSections.map((section, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, { borderLeftColor: section.color }]}
          onPress={() => navigation.navigate(section.screen)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: section.color }]}>
            <Ionicons name={section.icon as any} size={32} color="#FFF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCC" />
        </TouchableOpacity>
      ))}

      <View style={styles.warningBox}>
        <Ionicons name="warning" size={20} color="#F59E0B" />
        <Text style={styles.warningText}>
          Les actions administratives sont irréversibles. Veuillez procéder avec prudence.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#111827',
  },
  subheader: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#92400E',
  },
});
