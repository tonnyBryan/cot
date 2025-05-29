// src/screens/ProjectSelectionScreen.js
import React, {useContext, useEffect, useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {SessionContext} from "../context/SessionProvider";

const DEFAULT_PROJECT = {
    nom: 'Default Project',
    dateCreation: new Date().toISOString(),
    data_storage_key: 'appData',
};

export default function ProjectSelectionScreen() {
    const [projects, setProjects] = useState([]);
    const navigation = useNavigation();
    const { addSession, getSession } = useContext(SessionContext);


    useEffect(() => {
        const loadProjects = async () => {
            let stored = await AsyncStorage.getItem('projets');
            let parsed = stored ? JSON.parse(stored) : [];

            // Ajouter le projet par défaut si aucun projet n'existe
            if (parsed.length === 0) {
                parsed = [DEFAULT_PROJECT];
                await AsyncStorage.setItem('projets', JSON.stringify(parsed));
            }

            setProjects(parsed);
        };

        loadProjects();
    }, []);

    const selectProject = async (project) => {
        await addSession('currentProjectKey', project.data_storage_key);
        navigation.replace('MainTabs');
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.projectItem} onPress={() => selectProject(item)}>
            <Ionicons name="folder-open" size={24} color="#1976d2" style={styles.icon} />
            <View>
                <Text style={styles.projectName}>{item.nom}</Text>
                <Text style={styles.projectDate}>Créé le {new Date(item.dateCreation).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sélectionnez un projet</Text>
            <FlatList
                data={projects}
                keyExtractor={(item) => item.data_storage_key}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f1f8ff',
        borderRadius: 10,
        marginBottom: 12,
    },
    projectName: {
        fontSize: 16,
        fontWeight: '600',
    },
    projectDate: {
        fontSize: 12,
        color: '#666',
    },
    icon: {
        marginRight: 12,
    },
});
