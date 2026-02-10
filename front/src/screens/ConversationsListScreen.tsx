import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import type { Conversation } from '../types/Chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConversationsListScreen() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserUuid, setCurrentUserUuid] = useState<string>('');
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [userAvatars, setUserAvatars] = useState<Record<string, string | null>>({});

    const navigation = useNavigation();

    const loadConversations = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserUuid(user.uuid);
            }

            const data = await api.getConversations();
            setConversations(data);

            // Charger les infos de chaque utilisateur
            data.forEach(conv => {
                const otherUserUuid = conv.participants.find(uuid => uuid !== currentUserUuid);
                if (otherUserUuid) {
                    loadUserInfo(otherUserUuid);
                }
            });

        } catch (error: any) {
            // Silencieux si 401
            if (error.response?.status !== 401) {
                console.warn('Erreur chargement conversations:', error.message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadUserInfo = async (userUuid: string) => {
        if (userNames[userUuid]) return;
        
        try {
            const profile = await api.getUserPublicProfile(userUuid);
            
            setUserNames(prev => ({
                ...prev,
                [userUuid]: profile.user?.infosUser?.userName || 'Utilisateur inconnu'
            }));

            setUserAvatars(prev => ({
                ...prev,
                [userUuid]: profile.user?.infosUser?.avatar || null
            }));
        } catch (error: any) {
            // Silencieux si 401
            if (error.response?.status !== 401) {
                console.warn('Erreur chargement utilisateur:', error.message);
            }
            setUserNames(prev => ({
                ...prev,
                [userUuid]: 'Utilisateur'
            }));
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadConversations();
        }, [])
    );

    const getOtherParticipantUuid = (conversation: Conversation): string => {
        return conversation.participants.find(uuid => uuid !== currentUserUuid) || '';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const today = new Date();
        
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const renderConversation = ({ item }: { item: Conversation }) => {
        const otherUserUuid = getOtherParticipantUuid(item);
        const userName = userNames[otherUserUuid] || 'Chargement...';
        const avatar = userAvatars[otherUserUuid];

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => {
                    navigation.navigate('ChatScreen' as never, {
                        conversationId: item.id,
                        otherUserUuid: otherUserUuid,
                    } as never);
                }}
            >
                <View style={styles.avatarContainer}>
                    {avatar ? (
                        <Image 
                            source={{ uri: avatar }} 
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={28} color="#666666" />
                        </View>
                    )}
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.topRow}>
                        <Text style={styles.userName}>{userName}</Text>
                        {item.lastMessageAt && (
                            <Text style={styles.date}>
                                {formatDate(item.lastMessageAt)}
                            </Text>
                        )}
                    </View>
                    
                    {item.lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                    )}
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
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadConversations();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Aucune conversation</Text>
                        <Text style={styles.emptySubtext}>
                            Vos conversations apparaîtront ici après un échange validé
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
        backgroundColor: '#FFFFFF',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    listContainer: {
        flexGrow: 1,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    date: {
        fontSize: 13,
        color: '#999999',
    },
    lastMessage: {
        fontSize: 14,
        color: '#999999',
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginLeft: 78,
    },
    emptyContainer: {
        flex: 1,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
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
