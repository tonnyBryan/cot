import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {resetPaiements, resetAllData, loadAppData} from '../utils/storage';
import { authenticate } from '../utils/auth';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function SettingScreen() {
    const handleResetPaiements = () => {
        Alert.alert(
            'Confirmation',
            'Voulez-vous vraiment réinitialiser tous les paiements ? Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        authenticate(resetPaiements, 'Tous les paiements ont été réinitialisés.');
                    }
                }
            ]
        );
    };

    const handleFullReset = () => {
        Alert.alert(
            'Réinitialisation complète',
            'Cela supprimera toutes les familles, membres et paiements. Voulez-vous vraiment continuer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        authenticate(resetAllData, 'Toutes les données ont été réinitialisées.');
                    }
                }
            ]
        );
    };

    const handleExportData = async () => {
        try {
            const data = await loadAppData();
            const json = JSON.stringify(data, null, 2);

            const fileUri = FileSystem.documentDirectory + 'cotisation_data.json';
            await FileSystem.writeAsStringAsync(fileUri, json, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Exporter les données',
            });
        } catch (error) {
            console.error('Erreur exportation :', error);
            Alert.alert('Erreur', 'Impossible d’exporter les données.');
        }
    };

    const handleImportData = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return; // L'utilisateur a annulé ou rien sélectionné
            }

            const file = result.assets[0];

            const content = await FileSystem.readAsStringAsync(file.uri);
            const parsedData = JSON.parse(content);

            // Vérification basique du format
            if (!parsedData.families || !parsedData.members || !parsedData.payments) {
                Alert.alert('Fichier invalide', 'Ce fichier ne correspond pas au format attendu.');
                return;
            }

            Alert.alert(
                'Confirmation',
                'Importer ce fichier va écraser toutes vos données actuelles. Voulez-vous continuer ?',
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Importer',
                        style: 'destructive',
                        onPress: async () => {
                            authenticate(async () => {
                                await AsyncStorage.setItem('appData', JSON.stringify(parsedData));
                            }, 'Les données ont été importées avec succès.');
                        }

                    }
                ]
            );
        } catch (error) {
            console.error('Erreur importation :', error);
            Alert.alert('Erreur', 'Échec de l’importation des données.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.cardWrapper}>
                <TouchableOpacity style={styles.menuItem} onPress={handleExportData} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={24} color="#1976d2" style={styles.icon} />
                    <Text style={[styles.menuText, { color: '#1976d2' }]}>Exporter les données</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.cardWrapper}>
                <TouchableOpacity style={styles.menuItem} onPress={handleImportData} activeOpacity={0.7}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#388e3c" style={styles.icon} />
                    <Text style={[styles.menuText, { color: '#388e3c' }]}>Importer les données</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.cardWrapper}>
                <TouchableOpacity style={styles.menuItem} onPress={handleResetPaiements} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={24} color="#e53935" style={styles.icon} />
                    <Text style={[styles.menuText, { color: '#e53935' }]}>Réinitialiser les paiements</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.cardWrapper}>
                <TouchableOpacity style={styles.menuItem} onPress={handleFullReset} activeOpacity={0.7}>
                    <Ionicons name="alert-circle-outline" size={24} color="#d32f2f" style={styles.icon} />
                    <Text style={[styles.menuText, { color: '#d32f2f' }]}>Réinitialisation complète</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    cardWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },

    icon: {
        marginRight: 12,
    },

    menuText: {
        fontSize: 16,
        fontWeight: '500',
    },


    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
