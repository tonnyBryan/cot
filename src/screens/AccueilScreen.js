import React, {useState, useEffect, useRef, useContext} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useIsFocused } from '@react-navigation/native';
import { loadAppData } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';
import PulseBadge from '../components/PulseBadge';

import { MONTANT_HEBDOMADAIRE_PAR_MEMBRE } from '../utils/constants';
import {SessionContext} from "../context/SessionProvider";


function getWeekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7; // lundi = 0
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

export default function AccueilScreen() {
    const [appData, setAppData] = useState({ families: [], members: [], payments: [] });
    const [families, setFamilies] = useState([]);
    const [selectedFamilyId, setSelectedFamilyId] = useState(null);
    const [familyName, setFamilyName] = useState(null);

    const [members, setMembers] = useState([]);
    const scrollViewRef = useRef(null);
    const isFocused = useIsFocused();

    const [selectedCell, setSelectedCell] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const { addSession, getSession } = useContext(SessionContext);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await loadAppData();

            setAppData(data);
            setFamilies(data.families);

            if (data.families.length > 0) {
                const savedFamilyId = getSession('selectedFamilyId');
                const validFamilyId = data.families.find(f => f.id === savedFamilyId)?.id;
                setSelectedFamilyId(validFamilyId ?? data.families[0].id);

                const savedFamilyName = getSession("selectedFamilyName");
                setFamilyName((savedFamilyName !== undefined && savedFamilyName !== null) ? savedFamilyName : data.families[0].name);

            } else {
                setFamilyName(null);
                setSelectedFamilyId(null);
            }
        } catch (error) {
            console.error("Erreur lors du chargement :", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            loadData();
            // scrollToCurrentWeek();
        }

    }, [isFocused]);

    const formatDate = (date) =>
        date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    useEffect(() => {
        if (!selectedFamilyId) {
            setMembers([]);
            return;
        }
        const filteredMembers = appData.members.filter(m => m.familyId === selectedFamilyId);
        setMembers(filteredMembers);
    }, [selectedFamilyId, appData]);

    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

    const currentWeek = getWeekNumber(new Date());

    const scrollToCurrentWeek = () => {
        if (scrollViewRef.current) {
            const weekRowHeight = 45; // approximation
            const offsetY = weekRowHeight * (currentWeek - 1);
            scrollViewRef.current.scrollTo({ x: 0, y: offsetY, animated: true });
        }
    };

    function getWeekDateRange(weekNumber, year = new Date().getFullYear()) {
        const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
        const dayOfWeek = simple.getDay();
        const ISOweekStart = new Date(simple);
        if (dayOfWeek <= 4) {
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        } else {
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        }

        const ISOweekEnd = new Date(ISOweekStart);
        ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

        return { start: ISOweekStart, end: ISOweekEnd };
    }

    function getCurrentWeekNumber() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now - startOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    }


    // Calcul largeur totale du tableau : 60px pour la colonne semaine + 80px par membre
    const totalWidth = 90 + members.length * 90;

    const onFamilyChange = (itemValue) => {
        setSelectedFamilyId(itemValue);
        addSession('selectedFamilyId', itemValue);

        const selectedFamily = appData.families.find(f => f.id === itemValue);
        if (selectedFamily) {
            setFamilyName(selectedFamily.name);
            addSession('selectedFamilyName', selectedFamily.name);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tableau de paiement</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedFamilyId}
                    onValueChange={onFamilyChange}
                    style={styles.picker}
                    mode="dropdown"
                >
                    {families.map(family => (
                        <Picker.Item key={family.id} label={family.name} value={family.id} />
                    ))}
                </Picker>
            </View>

            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.scrollButton} onPress={scrollToCurrentWeek}>
                    <Text style={styles.scrollButtonText}>Aller à la semaine actuelle</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton} onPress={loadData}>
                    <Text style={styles.iconText}>🔄</Text>
                </TouchableOpacity>
            </View>

            {familyName ? (
                <Text style={styles.titleFamilyName}>
                    Tableau de cotisation de la famille <Text style={styles.titleFamily}>{familyName}</Text>
                </Text>
            ) : null}


            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 }}>
                    <ActivityIndicator size="large" color="#1877f2" />
                    <Text style={{ marginTop: 10, color: '#555' }}>Chargement des données...</Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    style={styles.tableContainer}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        style={{ width: totalWidth }}
                        ref={scrollViewRef}
                    >
                        {/* En-têtes */}
                        <View style={styles.tableHeader}>
                            <View style={[styles.tableCell, styles.semCell]}>
                                <Text style={styles.headerText}>Semaine</Text>
                            </View>
                            {members.map(member => (
                                <View key={member.id} style={styles.tableCell}>
                                    <Text style={styles.headerText}>{member.name}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Lignes des semaines */}
                        {weeks.map(week => (
                            <View key={week} style={styles.tableRow}>
                                <View style={[styles.tableCell, styles.weekCell]}>
                                    {(() => {
                                        const { start, end } = getWeekDateRange(week);
                                        const currentWeek = getCurrentWeekNumber();
                                        const isCurrentWeek = week === currentWeek;

                                        return (
                                            <>
                                                {isCurrentWeek && <PulseBadge />}
                                                <Text style={[styles.cellText, { fontSize: 10 }]}>
                                                    {start.toLocaleDateString('fr-FR')}
                                                </Text>
                                                <Text style={[styles.cellText, { fontSize: 10 }]}>
                                                    {end.toLocaleDateString('fr-FR')}
                                                </Text>
                                            </>
                                        );
                                    })()}
                                </View>

                                {members.map(member => {
                                    const paymentsForCell = appData.payments.filter(
                                        p => p.memberId === member.id && p.week === week
                                    );

                                    const totalDue = MONTANT_HEBDOMADAIRE_PAR_MEMBRE;
                                    const totalPaid = paymentsForCell.reduce((sum, p) => sum + (p.amount || 0), 0);
                                    const paidPercentage = Math.min(totalPaid / totalDue, 1);

                                    // Déterminer le status
                                    let status = 'neutre';
                                    if (totalPaid === totalDue) {
                                        status = 'full';
                                    } else if (totalPaid > 0 && totalPaid < totalDue) {
                                        status = 'partial';
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={member.id + '-' + week}
                                            style={[styles.tableCell]}
                                            onPress={() => {
                                                const family = families.find(f => f.id === member.familyId);
                                                setSelectedCell({
                                                    memberId: member.id,
                                                    memberName: member.name,
                                                    familyId: family?.id,
                                                    familyName: family?.name,
                                                    week: week,
                                                    status: status, // 👈 ajout du type ici
                                                });
                                                setModalVisible(true);
                                            }}
                                        >
                                            {totalPaid === totalDue ? (
                                                <View style={[styles.paidFull]} />
                                            ) : totalPaid > 0 ? (
                                                <View style={[styles.partialPaid, { width: `${paidPercentage * 100}%` }]} />
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}


                    </ScrollView>
                </ScrollView>
            )}

            {modalVisible && selectedCell && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Détails du paiement</Text>

                            <View style={styles.row}>
                                <View style={styles.infoCard}>
                                    <Text style={styles.cardLabel}>Famille</Text>
                                    <Text style={styles.cardValue}>{selectedCell.familyName}</Text>
                                </View>
                                <View style={styles.infoCard}>
                                    <Text style={styles.cardLabel}>Membre</Text>
                                    <Text style={styles.cardValue}>{selectedCell.memberName}</Text>
                                </View>
                            </View>

                            <View style={styles.infoCardFull}>
                                <Text style={styles.cardLabel}>Semaine</Text>
                                <Text style={styles.cardValue}>
                                    {formatDate(getWeekDateRange(selectedCell.week).start)} - {formatDate(getWeekDateRange(selectedCell.week).end)}
                                </Text>
                            </View>

                            <View style={styles.infoCardFull}>
                                <Text style={styles.cardLabel}>Statut</Text>
                                <Text
                                    style={[
                                        styles.cardValue,
                                        selectedCell.status === 'full' && { color: '#28a745' },
                                        selectedCell.status === 'partial' && { color: '#ffc107' },
                                        selectedCell.status === 'neutre' && { color: '#dc3545' },
                                    ]}
                                >
                                    {selectedCell.status === 'full'
                                        ? 'Payé intégralement'
                                        : selectedCell.status === 'partial'
                                            ? 'Partiellement payé'
                                            : 'Non payé'}
                                </Text>
                            </View>

                            {/* Action */}
                            <Pressable
                                style={[
                                    styles.actionButton,
                                    selectedCell.status === 'partial' && { backgroundColor: '#ffc107' },
                                    selectedCell.status === 'full' && {
                                        backgroundColor: '#f0f0f0',
                                        borderWidth: 1,
                                        borderColor: '#ccc',
                                    },
                                ]}
                                onPress={() => {
                                    setModalVisible(false);
                                    navigation.navigate('PaiementScreen', {
                                        memberId: selectedCell.memberId,
                                        memberName: selectedCell.memberName,
                                        familyId: selectedCell.familyId,
                                        familyName: selectedCell.familyName,
                                        week: selectedCell.week,
                                    });
                                }}
                            >
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        selectedCell.status === 'full' && { color: '#333' },
                                    ]}
                                >
                                    {selectedCell.status === 'full'
                                        ? 'Voir fiche'
                                        : selectedCell.status === 'partial'
                                            ? 'Compléter paiement'
                                            : 'Payer'}
                                </Text>
                            </Pressable>

                            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Fermer</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>


            )}
        </View>
    );
}

const styles = StyleSheet.create({
    titleFamilyName: {
        fontSize: 15,
        marginBottom: 10,
    },

    titleFamily: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    infoCardFull: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cardLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500',
    },
    cardValue: {
        fontSize: 16,
        color: '#222',
        fontWeight: '600',
    },
    actionButton: {
        backgroundColor: '#4068a1',
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    closeButton: {
        marginTop: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#4068a1',
        fontSize: 15,
        fontWeight: '500',
    },


    buttonsRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },

    iconButton: {
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 8,
        marginLeft: "auto",
        bottom: 9,
    },

    iconText: {
        fontSize: 20,
    },


    paidFull: {
        position: 'absolute',
        top: 9,
        left: 5,
        height: '100%',
        width: '100%',
        backgroundColor: '#64cf7d', // vert
        borderRadius: 4,
        zIndex: -1, // derrière le contenu textuel si jamais
    },

    partialPaid: {
        position: 'absolute',
        top: 9,
        left: 5,
        height: '100%',
        backgroundColor: '#f6c93e', // jaune
        borderRadius: 4,
        zIndex: -1,
    },


    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 15,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    scrollButton: {
        backgroundColor: '#eee',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    scrollButtonText: {
        color: '#7e7a7a',
        fontWeight: 'bold',
    },
    tableContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        height: 100,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4068a1',
        paddingVertical: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tableCell: {
        width: 90,
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderRightWidth: 1,
        borderRightColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekCell: {
        backgroundColor: '#f0f0f0',
        width: 90,
    },
    semCell: {
        width: 90,
    },
    headerText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cellText: {
        color: '#333',
    },

    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        elevation: 5,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    label: {
        fontWeight: '600',
        color: '#555',
    },
    value: {
        color: '#000',
    },
    payButton: {
        marginTop: 20,
        backgroundColor: '#1877f2',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
