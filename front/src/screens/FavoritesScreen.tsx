import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
                activeOpacity={0.7}
            >
                {/* Icône cœur en haut à droite */}
                <View style={styles.heartContainer}>
                    <Ionicons name="heart" size={24} color="#FF3B30" />
                </View>

                {/* Contenu principal */}
                <View style={styles.bookContent}>
                    {/* Titre */}
                    <Text style={styles.bookTitle} numberOfLines={2}>
                        {item.book.title}
                    </Text>

                    {/* Auteur */}
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#666666" />
                        <Text style={styles.bookAuthor} numberOfLines={1}>
                            {item.book.author}
                        </Text>
                    </View>

                    {/* Date d'ajout */}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#999999" />
                        <Text style={styles.addedDate}>
                            Ajouté le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#5B93FF" />
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
                        tintColor="#5B93FF"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-outline" size={80} color="#CCCCCC" />
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
        backgroundColor: '#F5F5F5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    favoriteItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
    },
    heartContainer: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
    },
    bookContent: {
        paddingRight: 32,
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
        lineHeight: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bookAuthor: {
        fontSize: 15,
        color: '#666666',
        marginLeft: 8,
        flex: 1,
    },
    addedDate: {
        fontSize: 12,
        color: '#999999',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999999',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
