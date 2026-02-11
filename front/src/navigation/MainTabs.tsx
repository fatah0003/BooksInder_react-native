import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import BookListScreen from '../screens/BookListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AuthStack from './AuthStack';
import AdminStack from './AdminStack';
import { useAuth } from '../context/AuthContext';
import BookDetailScreen from '../screens/BookDetailScreen';
import AddBookScreen from '../screens/AddBookScreen';
import EditBookScreen from '../screens/EditBookScreen';
import UserPublicProfileScreen from '../screens/UserPublicProfileScreen';
import ReceivedExchangesScreen from '../screens/ReceivedExchangesScreen';
import DetailExchangeScreen from '../screens/DetailExchangeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ConversationsListScreen from '../screens/ConversationsListScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ChatScreen from '../screens/ChatScreen';
import { Ionicons } from '@expo/vector-icons';


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
        options={{ title: 'Détails du livre', headerBackTitle: 'Retour' }}
      />
      <BookStack.Screen
        name="AddBook"
        component={AddBookScreen}
        options={{ title: 'Ajouter un livre', headerBackTitle: 'Retour' }}
      />
      <BookStack.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{ title: 'Modifier le livre', headerBackTitle: 'Retour' }}
      />
      <BookStack.Screen
        name="UserPublicProfile"
        component={UserPublicProfileScreen}
        options={{ title: 'Profil utilisateur', headerBackTitle: 'Retour' }}
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
        options={{ title: 'Demandes reçues', headerShown: true }}
      />
    </ExchangeStack.Navigator>
  );
}


// Pour le profil
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
        options={{ title: 'Modifier le profil', headerBackTitle: 'Retour' }}
      />
      <ProfileStack.Screen
        name="ReceivedExchanges"
        component={ReceivedExchangesScreen}
        options={{ title: 'Demandes reçues', headerBackTitle: 'Retour' }}
      />
      <ProfileStack.Screen
        name="DetailExchange"
        component={DetailExchangeScreen}
        options={{ title: 'Détail de l\'échange', headerBackTitle: 'Retour' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications', headerBackTitle: 'Retour' }}
      />
      <ProfileStack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Mes favoris', headerBackTitle: 'Retour' }}
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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');


  // Fonction pour charger le compteur de conversations non lues
  const loadUnreadChatsCount = async () => {
    if (!user) {
      setUnreadChatsCount(0);
      return;
    }

    try {
      const count = await api.getUnreadConversationsCount();
      setUnreadChatsCount(count);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Token expiré lors du chargement chat count');
        setUnreadChatsCount(0);
      } else {
        console.warn('Erreur chargement compteur chat:', error.message);
      }
    }
  };


  // Fonction pour charger le compteur de notifications non lues
  const loadUnreadNotificationsCount = async () => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const data = await api.getUnreadNotificationsCount();
      console.log('Compteur notifications reçu:', data);
      setUnreadNotificationsCount(data.unreadCount || 0);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Token expiré lors du chargement notifications count');
        setUnreadNotificationsCount(0);
      } else {
        console.warn('Erreur chargement compteur notifications:', error.message);
      }
    }
  };


  // Charge au démarrage
  useEffect(() => {
    if (user) {
      loadUnreadChatsCount();
      loadUnreadNotificationsCount();
    }
  }, [user]);


  // Polling toutes les 30 secondes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadChatsCount();
      loadUnreadNotificationsCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);


  return (
    <Tab.Navigator>
      {/* Livres */}
      <Tab.Screen
        name="Livres"
        component={BookStackScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Livres',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Chat */}
      <Tab.Screen
        name="Chat"
        component={user ? ChatStack : AuthStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
          tabBarBadge: unreadChatsCount > 0 ? unreadChatsCount : undefined,
        }}
      />

      {/* Profil */}
      <Tab.Screen
        name="Profil"
        component={user ? ProfileStackScreen : AuthStack}
        options={{
          headerShown: false,
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarBadge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        }}
      />

      {/* ✅ ONGLET ADMIN (conditionnel) */}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminStack}
          options={{
            headerShown: false,
            tabBarLabel: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};


export default MainTabs;
