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
    Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import type { Message } from '../types/Chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';


export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { conversationId, otherUserUuid } = route.params as {
        conversationId: string;
        otherUserUuid: string;
    };

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserUuid, setCurrentUserUuid] = useState<string>('');
    const [otherUserName, setOtherUserName] = useState<string>('');
    const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);

    const loadOtherUserInfo = async () => {
  try {
    const profile = await api.getUserPublicProfile(otherUserUuid);
    setOtherUserName(profile.user?.infosUser?.userName || 'Utilisateur');
    setOtherUserAvatar(profile.user?.infosUser?.avatar || null);
  } catch (error: any) {
    // Silencieux si 401
    if (error.response?.status !== 401) {
      console.warn('Erreur chargement profil:', error.message);
    }
    setOtherUserName('Utilisateur');
  }
};

    const loadMessages = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserUuid(user.uuid);
    }

    const data = await api.getConversationMessages(conversationId);
    setMessages(data);
    await api.markConversationAsRead(conversationId);

  } catch (error: any) {
    // Silencieux si 401
    if (error.response?.status !== 401) {
      console.warn('Erreur chargement messages:', error.message);
    }
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
        loadOtherUserInfo();
        loadMessages();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            loadMessages();
        }, 5000);

        return () => clearInterval(interval);
    }, [conversationId]);

    const handleSendMessage = async () => {
  const trimmedMessage = newMessage.trim();
  if (trimmedMessage === '') return;

  try {
    setSending(true);
    await api.sendMessage(conversationId, trimmedMessage);
    setNewMessage('');
    await loadMessages();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  } catch (error: any) {
    // Silencieux si 401
    if (error.response?.status !== 401) {
      console.warn('Erreur envoi message:', error.message);
    }
  } finally {
    setSending(false);
  }
};

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isMyMessage = item.senderUuid === currentUserUuid;
        const date = new Date(item.createdAt);
        const dateTimeString = `${date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        })} ${date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;

        const isLastInGroup = 
            index === messages.length - 1 ||
            new Date(messages[index + 1].createdAt).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }) !== date.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

        return (
            <View>
                <View
                    style={[
                        styles.messageRow,
                        isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
                    ]}
                >
                    {/* Avatar pour les messages de l'autre utilisateur */}
                    {!isMyMessage && (
                        <View style={styles.avatarContainer}>
                            {otherUserAvatar ? (
                                <Image 
                                    source={{ uri: otherUserAvatar }} 
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={20} color="#666666" />
                                </View>
                            )}
                        </View>
                    )}

                    {/* Bulle de message */}
                    <View
                        style={[
                            styles.messageBubble,
                            isMyMessage ? styles.myBubble : styles.otherBubble,
                        ]}
                    >
                        <Text 
                            style={[
                                styles.messageText,
                                isMyMessage ? styles.myMessageText : styles.otherMessageText
                            ]}
                        >
                            {item.content}
                        </Text>
                    </View>
                </View>

                {/* Timestamp SOUS le dernier message du groupe */}
                {isLastInGroup && (
                    <View style={[
                        styles.timestampContainer,
                        isMyMessage ? styles.timestampRight : styles.timestampLeft
                    ]}>
                        <Text style={styles.timestamp}>{dateTimeString}</Text>
                    </View>
                )}
            </View>
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Header personnalisé */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{otherUserName}</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {/* Liste des messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={({ item, index }) => renderMessage({ item, index })}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }}
            />

            {/* Zone de saisie */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Message..."
                        placeholderTextColor="#999999"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={styles.emojiButton}
                        onPress={() => {}}
                    >
                        <Ionicons name="happy-outline" size={24} color="#999999" />
                    </TouchableOpacity>
                </View>
                {newMessage.trim() !== '' && (
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendMessage}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={16} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </KeyboardAvoidingView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    headerPlaceholder: {
        width: 40,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    timestampContainer: {
        marginTop: 4,
        marginBottom: 12,
    },
    timestampLeft: {
        alignItems: 'flex-start',
        marginLeft: 40, 
    },
    timestampRight: {
        alignItems: 'flex-end',
    },
    timestamp: {
        fontSize: 11,
        color: '#999999',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'flex-end',
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        marginBottom: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
    },
    messageBubble: {
        maxWidth: '70%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#5B93FF',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#F0F0F0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    otherMessageText: {
        color: '#000000',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        alignItems: 'flex-end',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingRight: 4,
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        fontSize: 15,
        color: '#000000',
    },
    emojiButton: {
        padding: 8,
        marginRight: 4,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#5B93FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
