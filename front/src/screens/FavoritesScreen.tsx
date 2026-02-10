import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import type { Favorite } from '../types/Favorite';

export default function FavoritesScreen() {
    const navigation = useNavigation();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFavorites = async () => {
        try {
            const data = await api.getMyFavorites();
            setFavorites(data);
        } catch (error: any) {
            // Silencieux si 401
            if (error.response?.status !== 401) {
                console.warn('Erreur chargement favoris:', error.message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        loadFavorites();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadFavorites();
        }, [])
    );

    const renderFavorite = ({ item }: { item: Favorite }) => {
        return (
            <TouchableOpacity
                style={styles.favoriteItem}
                onPress={() => {
                    navigation.getParent()?.navigate('Livres', {
                        screen: 'BookDetail',
                        params: { bookUuid: item.book.uuid },
                    });
                }}
            >
                <View style={styles.favoriteContent}>
                    <View style={styles.bookInfo}>
                        <Text style={styles.bookTitle} numberOfLines={2}>
                            {item.book.title}
                        </Text>
                        <Text style={styles.bookAuthor} numberOfLines={1}>
                            par {item.book.author}
                        </Text>
                        <Text style={styles.bookIsbn}>ISBN: {item.book.isbn}</Text>
                    </View>

                    <View style={styles.heartContainer}>
                        <Text style={styles.heartIcon}>❤️</Text>
                    </View>
                </View>

                <Text style={styles.addedDate}>
                    Ajouté le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={favorites}
                renderItem={renderFavorite}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadFavorites();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💔</Text>
                        <Text style={styles.emptyText}>Aucun favori</Text>
                        <Text style={styles.emptySubtext}>
                            Les livres que vous ajoutez en favori apparaîtront ici
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 10,
    },
    favoriteItem: {
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    favoriteContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookInfo: {
        flex: 1,
        marginRight: 10,
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    bookAuthor: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    bookIsbn: {
        fontSize: 12,
        color: '#999',
    },
    heartContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartIcon: {
        fontSize: 32,
    },
    addedDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
