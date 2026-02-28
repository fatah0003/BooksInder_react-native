import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../types/Book';
import { BASE_URL } from '../config/apiConfig';
import { styles } from '../screens/style/BookListScreen.styles';

interface Props {
  book: Book;
  onPress: (book: Book) => void;
}

export default function BookCard({ book, onPress }: Props) {
  const frontImage = book.images.find(img => img.type === 'front');
  const imageToShow = frontImage || book.images[0];

  return (
    <TouchableOpacity style={styles.bookCard} onPress={() => onPress(book)}>
      {imageToShow ? (
        <Image
          source={{ uri: `${BASE_URL}${imageToShow.imageUrl}` }}
          style={styles.bookImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImagePlaceholder}>
          <View style={styles.iconCircle}>
            <Ionicons name="book-outline" size={56} color="#47769d" />
          </View>
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
        <View style={styles.bookFooter}>
          <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
          <Text style={styles.bookLocation}>{book.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}