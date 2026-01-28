import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BookListScreen from '../screens/BookListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthStack from './AuthStack';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

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
        component={user ? ProfileScreen : AuthStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
