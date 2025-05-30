import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import PaiementScreen from './src/screens/PaiementScreen';
import { SessionProvider } from './src/context/SessionProvider';
import ProjectSelectionScreen from "./src/screens/ProjectSelectionScreen";
import CreateProjectScreen from "./src/screens/CreateProjectScreen";

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <>
            <StatusBar hidden={true} />
            <SessionProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="ProjectSelection">
                        <Stack.Screen
                            name="ProjectSelection"
                            component={ProjectSelectionScreen}
                            options={{ headerShown: false }}
                        />

                        <Stack.Screen
                            name="CreateProject"
                            component={CreateProjectScreen}  // <-- ajout ici
                            options={{ title: 'Créer un projet' }}
                        />

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
