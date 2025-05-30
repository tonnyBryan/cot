import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation} from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SessionContext } from "../context/SessionProvider";

const DEFAULT_PROJECT = {
    nom: 'Default Project',
    logo: 'folder-outline',
    dateCreation: new Date().toISOString(),
    data_storage_key: 'appData',
};

export default function ProjectSelectionScreen() {
    const [projects, setProjects] = useState([]);
    const navigation = useNavigation();
    const { addSession } = useContext(SessionContext);
    const isFocused = useIsFocused();

    const loadProjects = async () => {
        let stored = await AsyncStorage.getItem('projets');
        let parsed = stored ? JSON.parse(stored) : [];

        console.log(parsed);

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

    const renderItem = ({ item }) => (
        <View style={styles.cardWrapper}>
            <TouchableOpacity style={styles.menuItem} onPress={() => selectProject(item)}>
                <Ionicons name={item.logo} size={28} color="#1e88e5" style={styles.icon} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.projectName}>{item.nom}</Text>
                    <Text style={styles.projectDate}>Créé le {new Date(item.dateCreation).toLocaleDateString()}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const createProject = () => {
        navigation.navigate('CreateProject');
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
