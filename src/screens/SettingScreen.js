import React, {useContext} from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {resetPaiements, resetAllData, loadAppData} from '../utils/storage';
import { authenticate } from '../utils/auth';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SessionContext} from "../context/SessionProvider";
import { useNavigation } from '@react-navigation/native';



export default function SettingScreen() {
    const { removeSession, getSession } = useContext(SessionContext);
    const navigation = useNavigation();

    const currentProject = getSession('currentProject');

    const handleResetPaiements = () => {
        const currentProjectKey = getSession('currentProjectKey');

        Alert.alert(
            'Confirmation',
            'Voulez-vous vraiment réinitialiser tous les paiements ? Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        authenticate(() => resetPaiements(currentProjectKey), 'Tous les paiements ont été réinitialisés.');
                    }
                }
            ]
        );
    };

    const handleFullReset = () => {
        const currentProjectKey = getSession('currentProjectKey');

        Alert.alert(
            'Réinitialisation complète',
            'Cela supprimera toutes les familles, membres et paiements. Voulez-vous vraiment continuer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        authenticate(() => resetAllData(currentProjectKey), 'Toutes les données ont été réinitialisées.');
                    }
                }
            ]
        );
    };

    const handleExportData = async () => {
        try {
            const currentProjectKey = getSession('currentProjectKey');
            const data = await loadAppData(currentProjectKey);

            const finalData = {
                data_storage_key: currentProjectKey,
                data: data,
            };

            const json = JSON.stringify(finalData, null, 2);

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
            const currentProjectKey = getSession('currentProjectKey');

            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];
            const content = await FileSystem.readAsStringAsync(file.uri);
            const parsedFile = JSON.parse(content);

            if (
                !parsedFile.data_storage_key ||
                !parsedFile.data ||
                !parsedFile.data.families ||
                !parsedFile.data.members ||
                !parsedFile.data.payments
            ) {
                Alert.alert('Fichier invalide', 'Le fichier ne correspond pas au format attendu.');
                return;
            }

            if (parsedFile.data_storage_key !== currentProjectKey) {
                Alert.alert('Clé de projet incorrecte', 'Ce fichier n’appartient pas à ce projet.');
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
                        onPress: () => {
                            authenticate(async () => {
                                await AsyncStorage.setItem(currentProjectKey, JSON.stringify(parsedFile.data));
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

    const handleQuitProject = () => {
        Alert.alert(
            'Quitter le projet',
            'Voulez-vous vraiment quitter ce projet ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        removeSession('currentProjectKey');
                        removeSession('selectedFamilyName');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'ProjectSelection' }],
                        });
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Paramètres</Text>

            {currentProject && (
                <View style={styles.projectCard}>
                    <Ionicons name={currentProject.logo} size={36} color="#4068a1" style={{ marginBottom: 8 }} />
                    <Text style={styles.projectName}>{currentProject.nom || 'Projet courant'}</Text>
                    <View style={styles.divider} />
                </View>
            )}


            <View style={styles.cardWrapper}>
                <TouchableOpacity style={styles.menuItem} onPress={handleExportData} activeOpacity={0.7}>
                    <Ionicons name="download-outline" size={24} color="#1976d2" style={styles.icon} />
                    <Text style={[styles.menuText, { color: '#4068a1' }]}>Exporter les données du projet</Text>
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

            <View style={styles.cardWrapper}>
                <TouchableOpacity style={styles.menuItem} onPress={handleQuitProject} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={24} color="#6d4c41" style={styles.icon} />
                    <Text style={[styles.menuText, { color: '#6d4c41' }]}>Quitter le projet</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}


const styles = StyleSheet.create({
    projectCard: {
        alignItems: 'center',
        backgroundColor: '#e0e3e3',
        paddingVertical: 20,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },

    projectName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4068a1',
        marginBottom: 10,
    },

    divider: {
        height: 1,
        backgroundColor: '#bbb',
        alignSelf: 'stretch',
        marginTop: 10,
        marginHorizontal: 10,
    },


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
