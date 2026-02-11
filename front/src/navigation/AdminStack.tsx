import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminBooksScreen from '../screens/AdminBooksScreen';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Administration' }}
      />
      <Stack.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{ title: 'Gestion des utilisateurs' }}
      />
      <Stack.Screen 
        name="AdminBooks" 
        component={AdminBooksScreen}
        options={{ title: 'Gestion des livres' }}
      />
    </Stack.Navigator>
  );
}
