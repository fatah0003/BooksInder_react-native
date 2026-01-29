import React from 'react';
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

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();
const BookStack = createStackNavigator();

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
    </BookStack.Navigator>
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
    </ProfileStack.Navigator>
  );
}

const MainTabs = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Livres" 
        component={BookStackScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profil" 
        component={user ? ProfileStackScreen : AuthStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
