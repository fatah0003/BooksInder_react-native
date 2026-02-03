import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import type { Conversation } from '../types/Chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConversationsListScreen() {

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserUuid, setCurrentUserUuid] = useState<string>('');
    const [userNames, setUserNames] = useState<Record<string, string>>({});


    const navigation = useNavigation();

    // Fonction qui récupère les conversations depuis le backend
const loadConversations = async () => {
    try {
        // 1. Récupère l'UUID de l'utilisateur connecté depuis AsyncStorage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUserUuid(user.uuid);
        }

        // 2. Appelle l'API pour récupérer les conversations
        const data = await api.getConversations();

        // 3. Met à jour l'état avec les conversations reçues
        setConversations(data);

        // 4. Charge le nom de chaque utilisateur
        data.forEach(conv => {
            const otherUserUuid = conv.participants.find(uuid => uuid !== currentUserUuid);
            if (otherUserUuid) {
                loadUserName(otherUserUuid);
            }
        });

    } catch (error) {
        console.error('Erreur chargement conversations:', error);
    } finally {
        // 5. Arrête le spinner de chargement dans tous les cas
        setLoading(false);
        setRefreshing(false);
    }
};

    // Charge le nom d'un utilisateur et le stocke
        const loadUserName = async (userUuid: string) => {
    if (userNames[userUuid]) return;
    
    try {
      const profile = await api.getUserPublicProfile(userUuid);
            
      setUserNames(prev => ({
        ...prev,
        [userUuid]: profile.user?.infosUser?.userName || 'Utilisateur inconnu'
      }));
    } catch (error) {
      console.error('Erreur chargement nom utilisateur:', error);
      setUserNames(prev => ({
        ...prev,
        [userUuid]: 'Utilisateur'
      }));
    }
  };




    // Charge les conversations au premier affichage de l'écran
    useEffect(() => {
        loadConversations();
    }, []);

    // Recharge les conversations à chaque fois qu'on revient sur cet écran
    useFocusEffect(
        React.useCallback(() => {
            loadConversations();
        }, [])
    );

    // Fonction pour trouver l'autre utilisateur dans la conversation
    const getOtherParticipantUuid = (conversation: Conversation): string => {
        // conversation.participants contient 2 UUID : moi + l'autre personne
        // On retourne celui qui n'est PAS moi
        return conversation.participants.find(uuid => uuid !== currentUserUuid) || '';
    };

    // Fonction pour afficher une conversation dans la liste
    const renderConversation = ({ item }: { item: Conversation }) => {
        const otherUserUuid = getOtherParticipantUuid(item);

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => {
                    // Quand on clique, on navigue vers l'écran de chat
                    navigation.navigate('ChatScreen' as never, {
                        conversationId: item.id,
                        otherUserUuid: otherUserUuid,
                    } as never);
                }}
            >
                <View style={styles.conversationContent}>
                    {/* Nom de l'utilisateur */}
                    <Text style={styles.userName}>
                        {userNames[otherUserUuid] || 'Chargement...'}
                    </Text>


                    {/* Dernier message */}
                    {item.lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                    )}

                    {/* Date du dernier message */}
                    {item.lastMessageAt && (
                        <Text style={styles.date}>
                            {new Date(item.lastMessageAt).toLocaleDateString('fr-FR')}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Si les données sont en train de charger, affiche un spinner
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Affichage principal de l'écran
    return (
        <View style={styles.container}>
            <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
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
    conversationItem: {
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
    conversationContent: {
        gap: 5,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
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

