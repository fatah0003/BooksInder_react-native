import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { api } from './services/api';

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
  try {
    const response = await api.getBooks();

    console.log('REPONSE API:', response);
    console.log('LIVRES:', response.data);

    setBooks(response.data); // ✅ ICI
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};




  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'red'}}>Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booksinder - Mes Livres</Text>
      <FlatList
  data={books}
  keyExtractor={(item) => item.uuid}
  renderItem={({ item }) => (
    <View style={styles.bookItem}>
      <Text style={styles.bookTitle}>titre : {item.title}</Text>
      <Text>auteur : {item.author}</Text>
      <Text>nb pages : {item.pages}</Text>
      <Text>nb pages : {item.location}</Text>
    </View>
  )}
/>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bookItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bookTitle: {
    fontSize: 16,
  },
});
