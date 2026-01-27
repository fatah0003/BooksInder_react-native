import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BookListScreen from '../screens/BookListScreen';
import AuthStack from './AuthStack';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#007AFF',
            }}
        >
            <Tab.Screen
                name="Livres"
                component={BookListScreen}
                options={{
                    tabBarLabel: 'Livres',
                }}
            />
            <Tab.Screen
                name="Profil"
                component={AuthStack}
                options={{
                    tabBarLabel: 'Profil',
                }}
            />

        </Tab.Navigator>
    );
}
