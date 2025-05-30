import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function IAScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🤖 Assistant IA</Text>
            <Text style={styles.text}>Bientôt ici : l'intelligence artificielle intégrée à votre application.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        color: '#666',
        paddingHorizontal: 20,
        textAlign: 'center',
    },
});
