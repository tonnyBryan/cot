import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import PaiementScreen from './src/screens/PaiementScreen';
import { SessionProvider } from './src/context/SessionProvider';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <>
            <StatusBar hidden={true} />
            <SessionProvider>
                <NavigationContainer>
                    <Stack.Navigator>
                        <Stack.Screen
                            name="MainTabs"
                            component={BottomTabNavigator}
                            options={{ headerShown: false }}
                        />

                        <Stack.Screen
                            name="PaiementScreen"
                            component={PaiementScreen}
                            options={{ title: 'Paiement' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </SessionProvider>
        </>
    );
}
