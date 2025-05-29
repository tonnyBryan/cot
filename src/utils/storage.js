import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'appData';

export const loadAppData = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { families: [], members: [], payments: [] };
    } catch (error) {
        console.error('Erreur chargement appData:', error);
        return { families: [], members: [], payments: [] };
    }
};

export const saveAppData = async (data) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Erreur sauvegarde appData:', error);
    }
};

export const resetPaiements = async () => {
    try {
        const data = await loadAppData();
        const updatedData = { ...data, payments: [] };
        await saveAppData(updatedData);
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation des paiements:', error);
    }
};

export const resetAllData = async () => {
    const emptyData = {
        families: [],
        members: [],
        payments: [],
    };


    await saveAppData(emptyData);
};

