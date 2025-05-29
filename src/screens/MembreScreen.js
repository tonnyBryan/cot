import React, {useState, useEffect, useContext} from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {loadAppData, saveAppData} from '../utils/storage';
import { authenticate } from '../utils/auth';
import {useIsFocused} from "@react-navigation/native";
import {SessionContext} from "../context/SessionProvider";


export default function MembreScreen() {
    const [appData, setAppData] = useState({ families: [], members: [], payments: [] });
    const [familyName, setFamilyName] = useState('');
    const [memberName, setMemberName] = useState('');
    const [selectedFamilyId, setSelectedFamilyId] = useState(null);
    const [familyModalVisible, setFamilyModalVisible] = useState(false);
    const [memberModalVisible, setMemberModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const isFocused = useIsFocused();
    const { addSession, getSession } = useContext(SessionContext);



    const loadData = async () => {
        try {
            const currentProjectKey = getSession('currentProjectKey');
            const data = await loadAppData(currentProjectKey);
            setAppData(data);
        } catch (error) {
            console.error('Erreur de chargement :', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            loadData();
        }
    }, [isFocused]);

    const handleAddFamily = async () => {
        if (!familyName.trim()) return;

        const newFamily = {
            id: Date.now().toString(),
            name: familyName.trim(),
        };

        const updatedData = {
            ...appData,
            families: [...appData.families, newFamily],
        };

        const currentProjectKey = getSession('currentProjectKey');
        await saveAppData(currentProjectKey, updatedData);
        setAppData(updatedData);
        setFamilyName('');
        setFamilyModalVisible(false);
    };

    const handleAddMember = async () => {
        if (!memberName.trim() || !selectedFamilyId) return;

        const newMember = {
            id: Date.now().toString(),
            name: memberName.trim(),
            familyId: selectedFamilyId,
        };

        const updatedData = {
            ...appData,
            members: [...appData.members, newMember],
        };

        const currentProjectKey = getSession('currentProjectKey');
        await saveAppData(currentProjectKey, updatedData);
        setAppData(updatedData);
        setMemberName('');
        setSelectedFamilyId(null);
        setMemberModalVisible(false);
    };

    const openMemberModal = (familyId) => {
        setSelectedFamilyId(familyId);
        setMemberModalVisible(true);
    };

    const handleDeleteFamily = (familyId) => {
        Alert.alert(
            'Supprimer la famille',
            'Cette action supprimera aussi tous les membres et paiements associés à cette famille. Voulez-vous continuer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        authenticate(() => deleteFamily(familyId), 'La famille et ses données ont été supprimées.');
                    }
                }
            ]
        );
    };

    const deleteFamily = async (familyId) => {
        const currentProjectKey = getSession('currentProjectKey');
        const data = await loadAppData(currentProjectKey);

        const newFamilies = data.families.filter(f => f.id !== familyId);

        const newMembers = data.members.filter(m => m.familyId !== familyId);
        const newPayments = data.payments.filter(p => p.familyId !== familyId);

        const updatedData = {
            ...data,
            families: newFamilies,
            members: newMembers,
            payments: newPayments,
        };

        await saveAppData(currentProjectKey, updatedData);
        setAppData(updatedData);
    }

    const supprimerMembre = async (memberId) => {
        const currentProjectKey = getSession('currentProjectKey');
        const data = await loadAppData(currentProjectKey);
        if (!data) return;

        const updatedMembers = data.members.filter(member => member.id !== memberId);
        const updatedPayments = data.payments.filter(payment => payment.memberId !== memberId);

        const updatedData = {
            ...data,
            members: updatedMembers,
            payments: updatedPayments,
            families: data.families
        };

        await saveAppData(currentProjectKey, updatedData);
        setAppData(updatedData);
    }

    const changerNom = async (newName, memberId) => {
        if (!memberId || !newName.trim()) return;

        const currentProjectKey = getSession('currentProjectKey');
        const data = await loadAppData(currentProjectKey);

        const updatedMembers = data.members.map(member =>
            member.id === memberId ? { ...member, name: newName.trim() } : member
        );

        const updatedData = {
            families: data.families ?? [],
            members: updatedMembers,
            payments: data.payments ?? [],
        };

        await saveAppData(currentProjectKey, updatedData);
        setAppData(updatedData);
        setEditModalVisible(false);
    };


    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Membres</Text>

            <TouchableOpacity style={styles.button} onPress={() => setFamilyModalVisible(true)}>
                <Text style={styles.buttonText}>+ Créer une famille</Text>
            </TouchableOpacity>

            <Modal
                transparent
                animationType="slide"
                visible={familyModalVisible}
                onRequestClose={() => setFamilyModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nom de la famille</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Famille Diop"
                            value={familyName}
                            onChangeText={setFamilyName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setFamilyModalVisible(false)}>
                                <Text style={styles.cancelButton}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddFamily}>
                                <Text style={styles.confirmButton}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent
                animationType="slide"
                visible={memberModalVisible}
                onRequestClose={() => setMemberModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nom du membre</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Aliou"
                            value={memberName}
                            onChangeText={setMemberName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                                <Text style={styles.cancelButton}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddMember}>
                                <Text style={styles.confirmButton}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {isLoading ? (
                <View style={styles.loadingFamiliesContainer}>
                    <ActivityIndicator size="large" color="#1877f2" />
                    <Text style={{ marginTop: 10, color: '#555' }}>Chargement des familles...</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.sectionTitle}>Liste des familles :</Text>
                    {appData.families.map((family) => {
                        const members = appData.members.filter(m => m.familyId === family.id);
                        return (
                            <View key={family.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.familyName}>{family.name}</Text>
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <TouchableOpacity onPress={() => openMemberModal(family.id)}>
                                            <Ionicons name="person-add-outline" size={20} color="#4068a1" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteFamily(family.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#e53935" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {members.length > 0 && (
                                    <View style={styles.membersContainer}>
                                        {members.map(member => (
                                            <View key={member.id}>
                                                <TouchableOpacity
                                                    key={member.id}
                                                    style={styles.memberBadge}
                                                    onLongPress={() => {
                                                        setSelectedMember(member); // mémorise le membre
                                                        setTooltipVisible(true);   // affiche le menu
                                                    }}
                                                >
                                                    <Ionicons name="person-circle" size={20} color="#555" />
                                                    <Text style={styles.memberName}>{member.name}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </>
            )}

            <Modal
                transparent
                visible={tooltipVisible}
                animationType="fade"
                onRequestClose={() => setTooltipVisible(false)}
            >
                <TouchableOpacity
                    style={styles.tooltipOverlay}
                    activeOpacity={1}
                    onPressOut={() => setTooltipVisible(false)}
                >
                    <View style={styles.tooltipMenu}>
                        {selectedMember && (
                            <Text style={styles.tooltipTitle}>{selectedMember.name}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.tooltipItem}
                            onPress={() => {
                                setNewMemberName(selectedMember.name);
                                setTooltipVisible(false);
                                setEditModalVisible(true);
                            }}

                        >
                            <Ionicons name="create-outline" size={18} color="#4068a1" />
                            <Text style={styles.tooltipText}>Modifier nom</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.tooltipItem}
                            onPress={() => {
                                setTooltipVisible(false);

                                Alert.alert(
                                    'Supprimer le membre',
                                    'Ce membre et toutes ses données de paiement seront définitivement supprimés. Voulez-vous continuer ?',
                                    [
                                        { text: 'Annuler', style: 'cancel' },
                                        {
                                            text: 'Supprimer',
                                            style: 'destructive',
                                            onPress: async () => {
                                                authenticate(() => supprimerMembre(selectedMember.id), 'Le membre et ses paiements ont été supprimés.');
                                            },
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color="#dc3545" />
                            <Text style={[styles.tooltipText, { color: '#dc3545' }]}>Supprimer</Text>
                        </TouchableOpacity>

                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                transparent
                animationType="slide"
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Modifier le nom de {selectedMember?.name}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            value={newMemberName}
                            onChangeText={setNewMemberName}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.cancelButton}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={async () => {
                                    changerNom(newMemberName, selectedMember.id);
                                    setEditModalVisible(false);
                                }}
                            >
                                <Text style={styles.confirmButton}>Changer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },

    tooltipTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },

    tooltipOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipMenu: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        width: 220,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    tooltipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    tooltipText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#4068a1',
        fontWeight: '500',
    },


    loadingFamiliesContainer: {
        marginTop: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },


    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f9f9f9',
        paddingTop: 50,
    },
    button: {
        backgroundColor: '#4068a1',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#888',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    familyName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    membersContainer: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    memberBadge: {
        backgroundColor: '#eef1f5',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 8,
        marginBottom: 8,
    },
    memberName: {
        marginLeft: 6,
        fontSize: 14,
        color: '#333',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        color: '#999',
        fontWeight: 'bold',
    },
    confirmButton: {
        color: '#4068a1',
        fontWeight: 'bold',
    },
});
