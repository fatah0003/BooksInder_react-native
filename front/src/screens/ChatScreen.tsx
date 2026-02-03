import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import type { Message } from '../types/Chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen() {
    // Récupération des paramètres passés lors de la navigation
    const route = useRoute();
    const { conversationId, otherUserUuid } = route.params as {
        conversationId: string;
        otherUserUuid: string;
    };

    // États
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserUuid, setCurrentUserUuid] = useState<string>('');

    // Référence pour la FlatList (pour scroller)
    const flatListRef = useRef<FlatList>(null);

    // Fonction qui charge les messages depuis le backend
    const loadMessages = async () => {
        try {
            // 1. Récupère l'UUID de l'utilisateur connecté
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserUuid(user.uuid);
            }

            // 2. Récupère les messages de cette conversation
            const data = await api.getConversationMessages(conversationId);

            // 3. Met à jour l'état avec les messages
            setMessages(data);

            // 4. Marque tous les messages comme lus
            await api.markConversationAsRead(conversationId);

        } catch (error) {
            console.error('Erreur chargement messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // Charge les messages au démarrage
    useEffect(() => {
        loadMessages();
    }, []);

    // Polling : recharge les messages toutes les 5 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            loadMessages();
        }, 5000); // 5000 ms = 5 secondes

        // Nettoyage : arrête le polling quand on quitte l'écran
        return () => clearInterval(interval);
    }, [conversationId]);

    // Fonction pour envoyer un nouveau message
    const handleSendMessage = async () => {
        // Vérifie que le message n'est pas vide
        const trimmedMessage = newMessage.trim();
        if (trimmedMessage === '') return;

        try {
            setSending(true);

            // Envoie le message à l'API
            await api.sendMessage(conversationId, trimmedMessage);

            // Vide le champ de saisie
            setNewMessage('');

            // Recharge les messages immédiatement pour voir le nouveau
            await loadMessages();

            // Scroll automatiquement vers le bas pour voir le nouveau message
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Erreur envoi message:', error);
        } finally {
            setSending(false);
        }
    };

    // Fonction pour afficher UN message
    const renderMessage = ({ item }: { item: Message }) => {
        // Est-ce que c'est MON message ou celui de l'autre ?
        const isMyMessage = item.senderUuid === currentUserUuid;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isMyMessage ? styles.myMessage : styles.otherMessage,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myBubble : styles.otherBubble,
                    ]}
                >
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
            </View>
        );
    };
    // Si les messages sont en train de charger
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Affichage principal
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Liste des messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }}
            />

            {/* Zone de saisie en bas */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Écrivez votre message..."
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (newMessage.trim() === '' || sending) && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSendMessage}
                    disabled={newMessage.trim() === '' || sending}
                >
                    <Text style={styles.sendButtonText}>
                        {sending ? '...' : '📤'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    messagesList: {
        padding: 10,
    },
    messageContainer: {
        marginBottom: 10,
        flexDirection: 'row',
    },
    myMessage: {
        justifyContent: 'flex-end',
    },
    otherMessage: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 15,
    },
    myBubble: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
    },
    otherBubble: {
        backgroundColor: '#E5E5EA',
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 16,
        color: '#000',
    },
    messageTime: {
        fontSize: 11,
        color: '#666',
        marginTop: 5,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        fontSize: 20,
    },
});

