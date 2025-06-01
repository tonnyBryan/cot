import React from 'react';
import {View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, ScrollView} from 'react-native';
import LottieView from 'lottie-react-native';
import IAContext from "../chatbot/IAStatic";

const { width } = Dimensions.get('window');


const IASidebarHelp = ({ visible, onClose, slideAnim }) => {
    return (
        <Animated.View style={[styles.container, { left: slideAnim }]}>
            {/* Partie fixe (Header + IA Info) */}
            <View style={styles.header}>
                <LottieView
                    source={require('../animation/bot-full2.json')}
                    autoPlay
                    loop
                    style={styles.lottie}
                />
                <Text style={styles.aiTitle}>
                    {IAContext.aiName} {IAContext.aiVersion}
                </Text>
            </View>

            {/* Partie scrollable */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>🧠 Capacités</Text>
                <View style={styles.sectionContent}>
                    <Bullet>Peut tout expliquer sur l’application : fonctionnement, écrans, fonctionnalités, etc.</Bullet>
                    <Bullet>Répond aux questions simples liées à l'application</Bullet>
                    <Bullet>Génère un aperçu structuré : liste, titre, texte</Bullet>
                    <Bullet>Analyse les données et fournit des conseils pertinents</Bullet>
                </View>

                <Text style={styles.sectionTitle}>🗨️ Conversation</Text>
                <View style={styles.sectionContent}>
                    <Bullet>L'application ne sauvegarde pas les conversations dans sa base de données</Bullet>
                    <Bullet>Une fois le projet quitté ou l'application fermée, l'historique est perdu</Bullet>
                </View>

                <Text style={styles.warningTitle}>⚠️ Limitations</Text>
                <View style={styles.sectionContent}>
                    <Bullet>Ne traite que les sujets liés à l'application</Bullet>
                    <Bullet>Peut faire des erreurs d’analyse ou d’interprétation</Bullet>
                    <Bullet>Ne gère pas encore les images ni les documents joints</Bullet>
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const Bullet = ({ children }) => (
    <Text style={styles.bullet}>• {children}</Text>
);

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 20,
    },

    container: {
        position: 'absolute',
        top: 0,
        width: width * 0.8,
        height: '100%',
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderColor: '#e0e0e0',
        padding: 20,
        zIndex: 9999,
        paddingTop: 50,
    },
    header: {
        backgroundColor: '#f5f8ff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    lottie: {
        width: 110,
        height: 110,
    },
    aiTitle: {
        marginTop: 10,
        fontWeight: '600',
        fontSize: 18,
        color: '#4068a1',
    },
    sectionTitle: {
        fontWeight: '700',
        fontSize: 20,
        marginBottom: 10,
        color: '#7e7979',
    },
    warningTitle: {
        fontWeight: '700',
        fontSize: 18,
        marginBottom: 10,
        color: '#7e7979',
    },
    sectionContent: {
        marginBottom: 20,
    },
    bullet: {
        fontSize: 16,
        color: '#444',
        marginBottom: 6,
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: '#4068a1',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default IASidebarHelp;
