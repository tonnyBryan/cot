import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SessionContext } from "../context/SessionProvider";
import {loadAppData, supprimerProjet} from "../utils/storage";
import {authenticate} from "../utils/auth";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Animated } from 'react-native';


const DEFAULT_PROJECT = {
    nom: 'Default Project',
    logo: 'folder-outline',
    dateCreation: new Date().toISOString(),
    data_storage_key: 'appData',

    dateDebut: new Date().toISOString(),
    dateFin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    montant_par_tranche: 10000,
    typeTranche: 'week',
    variableDays: 7
};


export default function ProjectSelectionScreen() {
    const [projects, setProjects] = useState([]);
    const navigation = useNavigation();
    const { addSession } = useContext(SessionContext);
    const isFocused = useIsFocused();
    const [selectedProjectKey, setSelectedProjectKey] = useState(null);
    const animationRefs = useRef({});



    const loadProjects = async () => {
        let stored = await AsyncStorage.getItem('projets');
        let parsed = stored ? JSON.parse(stored) : [];

        const hasDefault = parsed.some(proj => proj.data_storage_key === DEFAULT_PROJECT.data_storage_key);

        if (!hasDefault) {
            parsed = [DEFAULT_PROJECT, ...parsed];
            await AsyncStorage.setItem('projets', JSON.stringify(parsed));
        }

        parsed.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));

        setProjects(parsed);
    };

    useEffect(() => {
        if (isFocused) {
            loadProjects();
        }
    }, [isFocused]);

    const selectProject = async (project) => {
        await addSession('currentProjectKey', project.data_storage_key);
        await addSession('currentProject', project);
        navigation.replace('MainTabs');
    };

    const handleExportProjet = async (projet) => {
        try {
            const data = await loadAppData(projet.data_storage_key);

            const finalData = {
                projet,
                data
            };

            const json = JSON.stringify(finalData, null, 2);

            const fileUri = FileSystem.documentDirectory + `projet_${projet.nom.replace(/\s+/g, '_')}.json`;
            await FileSystem.writeAsStringAsync(fileUri, json, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Exporter le projet',
            });
        } catch (error) {
            console.error('❌ Erreur exportation projet :', error);
            Alert.alert('Erreur', 'Impossible d’exporter le projet.');
        }
    };


    const renderItem = ({ item }) => {
        const isSelected = selectedProjectKey === item.data_storage_key;

        if (!animationRefs.current[item.data_storage_key]) {
            animationRefs.current[item.data_storage_key] = new Animated.Value(0);
        }

        return (
            <Animated.View
                style={[
                    styles.cardWrapper,
                    {
                        transform: [
                            {
                                translateX: animationRefs.current[item.data_storage_key],
                            },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => selectProject(item)}
                    onLongPress={() => {
                        setSelectedProjectKey(item.data_storage_key);
                        setTimeout(() => setSelectedProjectKey(null), 5000);
                    }}
                >
                    <Ionicons name={item.logo} size={28} color="#1e88e5" style={styles.icon} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.projectName}>{item.nom}</Text>
                        <Text style={styles.projectDate}>Créé le {new Date(item.dateCreation).toLocaleDateString()}</Text>
                    </View>

                    {isSelected && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleExportProjet(item)}
                            >
                                <Ionicons name="download-outline" size={20} color="#4068a1" />
                            </TouchableOpacity>

                            {item.data_storage_key !== 'appData' && (
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => confirmDeleteProject(item.data_storage_key)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#e53935" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };



    const createProject = () => {
        navigation.navigate('CreateProject');
    };

    const confirmDeleteProject = (projectKey) => {
        Alert.alert(
            'Confirmation',
            'Voulez-vous vraiment supprimer ce projet ? Cette action est irréversible.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Confirmer',
                    style: 'destructive',
                    onPress: () => {
                        authenticate(
                            async () => {
                                Animated.timing(animationRefs.current[projectKey], {
                                    toValue: 500,
                                    duration: 300,
                                    useNativeDriver: true,
                                }).start(async () => {
                                    await supprimerProjet(projectKey);

                                    setProjects(prev =>
                                        prev.filter(p => p.data_storage_key !== projectKey)
                                    );
                                });
                            },
                            ""
                        );
                    }
                }
            ]
        );
    };





    return (
        <View style={styles.container}>
            <Text style={styles.appName}>Cot™</Text>

            <FlatList
                data={projects}
                keyExtractor={(item) => item.data_storage_key}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity style={styles.fab} onPress={createProject}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    actionBtn: {
        marginLeft: 10,
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#f1f3f6',
    },

    cardWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#fff',
        shadowColor: '#cdcbcb',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 3,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },

    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: '#f9fbfd',
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4068a1',
        marginBottom: 30,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        color: '#444',
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
    },
    projectDate: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    icon: {
        marginRight: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#4068a1',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
    },
});
