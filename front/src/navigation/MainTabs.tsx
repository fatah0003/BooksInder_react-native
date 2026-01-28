import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import BookListScreen from '../screens/BookListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AuthStack from './AuthStack';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

// Stack pour le profil (ProfileScreen + EditProfileScreen)
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
        component={BookListScreen}
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
