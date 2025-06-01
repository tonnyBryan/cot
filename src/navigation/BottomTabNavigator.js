import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import AccueilScreen from '../screens/AccueilScreen';
import MembreScreen from '../screens/MembreScreen';
import RapportScreen from '../screens/RapportScreen';
import SettingScreen from "../screens/SettingScreen";
import IAScreen from "../screens/IAScreen";
import LottieView from "lottie-react-native";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'IA') {
                        return (
                            <LottieView
                                source={require('../animation/bot-icon2.json')}
                                autoPlay
                                loop
                                style={{ width: size + 6, height: size + 6 }}
                            />
                        );
                    }

                    let iconName;
                    if (route.name === 'Accueil') iconName = 'home-outline';
                    else if (route.name === 'Membre') iconName = 'people-outline';
                    else if (route.name === 'Rapport') iconName = 'analytics-outline';
                    else if (route.name === 'Menu') iconName = 'menu-outline';

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#4068a1',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Accueil" component={AccueilScreen} />
            <Tab.Screen name="Membre" component={MembreScreen} />
            <Tab.Screen name="Rapport" component={RapportScreen} />
            <Tab.Screen name="IA" component={IAScreen} />
            <Tab.Screen name="Menu" component={SettingScreen} />
        </Tab.Navigator>
    );
}
