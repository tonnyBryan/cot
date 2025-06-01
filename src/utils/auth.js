import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

/**
 * Authentifie l'utilisateur avant d'exécuter une action sécurisée.
 * @param {Function} action - La fonction à exécuter après une authentification réussie.
 * @param {string} successMessage - Message à afficher en cas de succès.
 */
export const authenticate = async (action, successMessage) => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
        Alert.alert('Erreur', 'Aucune méthode de sécurité biométrique trouvée sur ce téléphone.');
        return;
    }

    const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentification requise',
        fallbackLabel: 'Utiliser le mot de passe',
    });

    if (result.success) {
        await action();
        if (successMessage.trim() !== "") {
            Alert.alert('Succès', successMessage);
        }
    } else {
        Alert.alert('Échec', 'Authentification annulée ou échouée.');
    }
};
