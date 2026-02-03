import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import BookListScreen from '../screens/BookListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AuthStack from './AuthStack';
import { useAuth } from '../context/AuthContext';
import BookDetailScreen from '../screens/BookDetailScreen';
import AddBookScreen from '../screens/AddBookScreen';
import EditBookScreen from '../screens/EditBookScreen';
import UserPublicProfileScreen from '../screens/UserPublicProfileScreen';
import ReceivedExchangesScreen from '../screens/ReceivedExchangesScreen';
import DetailExchangeScreen from '../screens/DetailExchangeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();
const BookStack = createStackNavigator();
const ExchangeStack = createStackNavigator();
const ChatStackNav = createStackNavigator();

// Pour les livres
function BookStackScreen() {
  return (
    <BookStack.Navigator>
      <BookStack.Screen
        name="BookList"
        component={BookListScreen}
        options={{ headerShown: false }}
      />
      <BookStack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{
          title: 'Détails du livre',
          headerBackTitle: 'Retour'
        }}
      />
      <BookStack.Screen
        name="AddBook"
        component={AddBookScreen}
        options={{
          title: 'Ajouter un livre',
          headerBackTitle: 'Retour'
        }}
      />
      <BookStack.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{
          title: 'Modifier le livre',
          headerBackTitle: 'Retour'
        }}
      />
      <BookStack.Screen
        name="UserPublicProfile"
        component={UserPublicProfileScreen}
        options={{
          title: 'Profil utilisateur',
          headerBackTitle: 'Retour'
        }}
      />
      <BookStack.Screen
        name="DetailExchange"
        component={DetailExchangeScreen}
        options={{ title: 'Détail de l\'échange' }}
      />

    </BookStack.Navigator>
  );
}

// Pour les échanges
function ExchangeStackScreen() {
  return (
    <ExchangeStack.Navigator>
      <ExchangeStack.Screen
        name="ReceivedExchanges"
        component={ReceivedExchangesScreen}
        options={{
          title: 'Demandes reçues',
          headerShown: true
        }}
      />
    </ExchangeStack.Navigator>
  );
}


// Pour le profil (ProfileScreen + EditProfileScreen)
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Modifier le profil',
          headerBackTitle: 'Retour'
        }}
      />
      <ProfileStack.Screen
        name="ReceivedExchanges"
        component={ReceivedExchangesScreen}
        options={{
          title: 'Demandes reçues',
          headerBackTitle: 'Retour'
        }}
      />
      <ProfileStack.Screen
        name="DetailExchange"
        component={DetailExchangeScreen}
        options={{
          title: 'Détail de l\'échange',
          headerBackTitle: 'Retour'
        }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications', headerBackTitle: 'Retour' }}
      />
    </ProfileStack.Navigator>
  );
}

// pour le chat
function ChatStack() {
  return (
    <ChatStackNav.Navigator>
      <ChatStackNav.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
        options={{ title: 'Messagerie' }}
      />
      <ChatStackNav.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </ChatStackNav.Navigator>
  );
}




const MainTabs = () => {
  const { user } = useAuth();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  // Fonction pour charger le compteur de conversations non lues
  const loadUnreadChatsCount = async () => {
    if (!user) return; // Si pas connecté, on ne fait rien

    try {
      const count = await api.getUnreadConversationsCount();
      setUnreadChatsCount(count);
    } catch (error) {
      console.error('Erreur chargement compteur chat:', error);
    }
  };

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Fonction pour charger le compteur de notifications non lues
  const loadUnreadNotificationsCount = async () => {
    if (!user) return;

    try {
      const data = await api.getUnreadNotificationsCount();
      console.log('🔔 Compteur notifications reçu:', data);
      setUnreadNotificationsCount(data.unreadCount || 0); // <-- unreadCount au lieu de count
    } catch (error) {
      console.error('Erreur chargement compteur notifications:', error);
    }
  };



  // Charge au démarrage
  // Charge au démarrage
  useEffect(() => {
    if (user) {
      loadUnreadChatsCount();
      loadUnreadNotificationsCount(); // <-- Ajoute cette ligne
    }
  }, [user]);

  // Polling toutes les 30 secondes (comme les notifications)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadChatsCount();
      loadUnreadNotificationsCount(); // <-- Ajoute cette ligne
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user]);


  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Livres"
        component={BookStackScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Chat"
        component={user ? ChatStack : AuthStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
          tabBarBadge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
        }}
      />


      <Tab.Screen
        name="Profil"
        component={user ? ProfileStackScreen : AuthStack}
        options={{
          headerShown: false,
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
      />

    </Tab.Navigator>

  );
};

export default MainTabs;
