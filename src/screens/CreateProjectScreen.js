// src/screens/CreateProjectScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    FlatList,
    Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import {Ionicons} from "@expo/vector-icons";
import {creerProjet} from "../utils/storage";
import {DEVIS} from "../utils/constants";

const ioniconLogos = [
    'logo-amplify',
    'logo-deviantart',
    'logo-docker',
    'logo-figma',
    'logo-firebase',
    'logo-twitter',
    'logo-github',
    'logo-skype',
    'logo-xbox',
    'logo-vue',
    'logo-react',
    'logo-nodejs',
];

function formatDateFR(date) {
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

const paymentTypes = [
    { label: 'Par jour', value: 'day' },
    { label: 'Par semaine', value: 'week' },
    { label: 'Par mois', value: 'month' },
    { label: 'Variable (nombre de jours)', value: 'variable' },
];

export default function CreateProjectScreen() {
    const navigation = useNavigation();

    const [nom, setNom] = useState('');
    const [dateDebut, setDateDebut] = useState(new Date());
    const [dateFin, setDateFin] = useState(new Date());
    const [typeTranche, setTypeTranche] = useState('day');
    const [variableDays, setVariableDays] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(null); // 'debut' | 'fin' | null

    const [logo, setLogo] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [montant, setMontant] = useState('');


    const openModal = () => setModalVisible(true);
    const closeModal = () => setModalVisible(false);

    const chooseLogo = (iconName) => {
        setLogo(iconName);
        closeModal();
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(null);
        if (!selectedDate) return;

        if (showDatePicker === 'debut') setDateDebut(selectedDate);
        else if (showDatePicker === 'fin') setDateFin(selectedDate);
    };

    const proceedCreation = async (montant) => {
        if (!nom.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir un nom de projet');
            return;
        }

        if (dateFin < dateDebut) {
            Alert.alert('Erreur', 'La date de fin doit être après la date de début');
            return;
        }

        // Définir variableDays selon le type si ce n'est pas variable
        let days = 0;
        if (typeTranche === 'day') days = 1;
        else if (typeTranche === 'week') days = 7;
        else if (typeTranche === 'month') days = 30;
        else if (typeTranche === 'variable') {
            if (!variableDays || isNaN(variableDays) || variableDays <= 0) {
                Alert.alert('Erreur', 'Veuillez entrer un nombre valide de jours pour la tranche variable');
                return;
            }
            days = Number(variableDays);
        }

        // Calculer la différence en jours entre dateFin et dateDebut
        const diffTime = dateFin.getTime() - dateDebut.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24); // convertir ms en jours

        if (diffDays < days) {
            Alert.alert(
                'Erreur',
                `L'intervalle entre la date de début et la date de fin doit être au moins de ${days} jour(s).`
            );
            return;
        }

        const finalLogo = logo || 'folder-outline';
        if (!logo) setLogo(finalLogo);

        const newProject = {
            nom,
            logo: finalLogo,
            montant_par_tranche: montant,
            dateCreation: new Date().toISOString(),
            dateDebut: dateDebut.toISOString(),
            dateFin: dateFin.toISOString(),
            typeTranche,
            variableDays: typeTranche === 'variable' ? Number(variableDays) : days,
            data_storage_key: `project_${Date.now()}`,
            uuid: Date.now().toString(),
        };

        try {
            await creerProjet(newProject);
            navigation.reset({
                index: 0,
                routes: [{name: 'ProjectSelection'}],
            });
            Alert.alert('Succès', 'Projet créé avec succès !');
        } catch (err) {
            Alert.alert('Erreur', err.message);
        }
    }


    const handleSubmit = () => {
        let montantNormal = parseInt(montant.replace(/\s/g, ''));
        if (isNaN(montantNormal) || montantNormal < 100) {
            Alert.alert('Erreur', 'Veuillez entrer un montant valide (minimum 100)');
            return;
        }

        if (montantNormal % 100 !== 0) {
            const lower = Math.floor(montantNormal / 100) * 100;
            const upper = lower + 100;

            Alert.alert(
                'Montant non multiple de 100',
                `Le montant ${montantNormal} n'est pas un multiple de 100.\nChoisissez une option :`,
                [
                    {
                        text: 'Annuler',
                        style: 'cancel'
                    },
                    {
                        text: `${lower}`,
                        onPress: () => {
                            montantNormal = lower;
                            setMontant(montantNormal);
                            proceedCreation(montantNormal);
                        }
                    },
                    {
                        text: `${upper}`,
                        onPress: () => {
                            montantNormal = upper;
                            setMontant(montantNormal);
                            proceedCreation(montantNormal);
                        }
                    }
                ]
            );
        } else {
            proceedCreation(montantNormal);
        }
    };

    const renderIcon = ({ item }) => (
        <TouchableOpacity
            style={styles.iconItem}
            onPress={() => chooseLogo(item)}
        >
            <Ionicons name={item} size={32} color="#4068a1" />
        </TouchableOpacity>
    );

    const formatMontant = (text) => {
        const numericText = text.replace(/\D/g, '');

        const number = parseInt(numericText, 10);

        if (isNaN(number)) {
            setMontant('');
            return;
        }

        const formatted = number.toLocaleString('fr-FR').replace(/\s/g, ' ');

        setMontant(formatted);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ flex: 1 }}>
                        <View style={styles.card}>
                            <Text style={styles.label}>Nom du projet</Text>
                            <View style={[styles.row, { alignItems: 'center' }]}>
                                <TextInput
                                    value={nom}
                                    onChangeText={setNom}
                                    placeholder="Entrez le nom du projet"
                                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                                    underlineColorAndroid="transparent"
                                />
                                <TouchableOpacity onPress={openModal} style={styles.logoButton}>
                                    <Ionicons
                                        name={logo || 'logo-codepen'} // logo par défaut inexistant/placeholder
                                        size={28}
                                        color={logo ? '#4068a1' : '#aaa'} // gris si aucun logo choisi
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>


                        {/* Dates */}
                        <View style={styles.card}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Date de début de paiement</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowDatePicker('debut');
                                    }}
                                    style={styles.dateInput}>
                                    <Text style={styles.dateText}>{formatDateFR(dateDebut)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.field}>
                                <Text style={[styles.label, { marginTop: 20 }]}>Date de fin de paiement</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setShowDatePicker('fin');
                                    }}
                                    style={styles.dateInput}>
                                    <Text style={styles.dateText}>{formatDateFR(dateFin)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Type tranche */}
                        <View style={styles.card}>
                            <Text style={styles.label}>Type de tranche de paiement</Text>
                            {paymentTypes.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.radioOption,
                                        typeTranche === type.value && styles.radioOptionSelected,
                                    ]}
                                    onPress={() => {
                                        Keyboard.dismiss();
                                        setTypeTranche(type.value);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.radioCircle}>
                                        {typeTranche === type.value && <View style={styles.radioChecked} />}
                                    </View>
                                    <Text style={styles.radioLabel}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}

                            {typeTranche === 'variable' && (
                                <TextInput
                                    keyboardType="numeric"
                                    placeholder="Nombre de jours dans une tranche"
                                    value={variableDays}
                                    onChangeText={setVariableDays}
                                    style={[styles.input, { marginTop: 12 }]}
                                    underlineColorAndroid="transparent"
                                />
                            )}
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.label}>Montant à payer par tranche</Text>

                            <View style={{ position: 'relative', width: '100%' }}>
                                <TextInput
                                    style={[styles.input, { paddingRight: 40 }]} // espace à droite pour le texte
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={montant}
                                    onChangeText={formatMontant}
                                    placeholderTextColor="#999"
                                />
                                <Text
                                    style={ styles.inputUnit }
                                >
                                    {DEVIS}
                                </Text>
                            </View>
                        </View>

                        {/* Bouton créer */}
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Créer le projet</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={showDatePicker === 'debut' ? dateDebut : dateFin}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                            />
                        )}
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Choisir un logo</Text>
                        <FlatList
                            data={ioniconLogos}
                            keyExtractor={(item) => item}
                            numColumns={4}
                            renderItem={renderIcon}
                            contentContainerStyle={styles.iconGrid}
                        />
                        <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                            <Text style={styles.modalCloseText}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    inputUnit : {
        position: 'absolute',
        right: 10,
        top: 22,
        color: '#444',
        fontWeight: '600',
    },


    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoButton: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#f1f3f5',
        justifyContent: 'center',
        alignItems: 'center',
        top: 4,
        height: 45,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },

    iconGrid: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    iconItem: {
        margin: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#4068a1',
    },

    modalCloseButton: {
        marginTop: 20,
        backgroundColor: '#4068a1',
        paddingVertical: 10,
        borderRadius: 8,
    },

    modalCloseText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },


    container: {
        flexGrow: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    field: {
        flexDirection: 'column',
    },
    label: {
        fontWeight: '600',
        fontSize: 15,
        color: '#333',
    },
    input: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f1f3f5',
        borderRadius: 6,
        fontSize: 15,
        color: '#222',
        height: 45,
    },
    dateInput: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#f1f3f5',
        borderRadius: 6,
    },
    dateText: {
        fontSize: 15,
        color: '#222',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    radioOptionSelected: {
        backgroundColor: '#d0e2ff',
    },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#4068a1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    radioChecked: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: '#4068a1',
    },
    radioLabel: {
        fontSize: 15,
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#4068a1',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
