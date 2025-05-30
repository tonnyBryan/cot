import AsyncStorage from '@react-native-async-storage/async-storage';

export const loadAppData = async (dataStorageKey) => {
    try {
        const data = await AsyncStorage.getItem(dataStorageKey);
        return data ? JSON.parse(data) : { families: [], members: [], payments: [] };
    } catch (error) {
        console.error(`Erreur chargement ${dataStorageKey}:`, error);
        return { families: [], members: [], payments: [] };
    }
};

export const saveAppData = async (dataStorageKey, data) => {
    try {
        await AsyncStorage.setItem(dataStorageKey, JSON.stringify(data));
    } catch (error) {
        console.error(`Erreur sauvegarde ${dataStorageKey}:`, error);
    }
};

export const resetPaiements = async (dataStorageKey) => {
    try {
        const data = await loadAppData(dataStorageKey);
        const updatedData = { ...data, payments: [] };
        await saveAppData(dataStorageKey, updatedData);
    } catch (error) {
        console.error(`❌ Erreur lors de la réinitialisation des paiements (${dataStorageKey}):`, error);
    }
};

export const resetAllData = async (dataStorageKey) => {
    const emptyData = {
        families: [],
        members: [],
        payments: [],
    };
    await saveAppData(dataStorageKey, emptyData);
};

export const creerProjet = async (nouveauProjet) => {
    try {
        const projetsJson = await AsyncStorage.getItem('projets');
        const projets = projetsJson ? JSON.parse(projetsJson) : [];

        projets.push(nouveauProjet);
        await AsyncStorage.setItem('projets', JSON.stringify(projets));

        const dataVide = {
            families: [],
            members: [],
            payments: [],
        };
        await AsyncStorage.setItem(nouveauProjet.data_storage_key, JSON.stringify(dataVide));

    } catch (error) {
        console.error('❌ Erreur lors de la création du projet :', error);
    }
};




