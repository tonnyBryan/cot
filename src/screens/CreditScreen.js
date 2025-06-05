import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function CreditScreen() {
    return (
        <ScrollView style={styles.container}>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
                <Text style={styles.name}>Anderson Tonny Bryan</Text>
                <Text style={styles.subtitle}>Développeur de cette application</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
                <Text style={styles.sectionTitle}>🎓 Formation</Text>
                <Text style={styles.cardText}>Étudiant à IT University de Madagascar</Text>
                <Text style={styles.cardText}>Licence en Développement Informatique</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500)} style={styles.card}>
                <Text style={styles.sectionTitle}>💼 Expérience</Text>
                <Text style={styles.cardText}>Employé chez BICI Madagascar</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(700)} style={styles.card}>
                <Text style={styles.sectionTitle}>📞 Contact</Text>
                <Text style={styles.cardText}>Facebook: Tonny Anderson</Text>
                <Text style={styles.cardText}>WhatsApp: +261 34 14 561 41</Text>
                <Text style={styles.cardText} onPress={() => Linking.openURL('mailto:andersontonnybryan@gmail.com')}>
                    Email: andersontonnybryan@gmail.com
                </Text>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#444',
    },
    cardText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 4,
    },
});
