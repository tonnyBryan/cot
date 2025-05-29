import React, {useState, useCallback, useContext} from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadAppData } from '../utils/storage';
import {Ionicons} from "@expo/vector-icons";
import {SessionContext} from "../context/SessionProvider";

export default function RapportScreen() {
    const [appData, setAppData] = useState(null);
    const [total, setTotal] = useState(0);
    const [totauxParFamille, setTotauxParFamille] = useState({});
    const [openFamilies, setOpenFamilies] = useState({});
    const { addSession, getSession } = useContext(SessionContext);


    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                const currentProjectKey = getSession('currentProjectKey');
                const data = await loadAppData(currentProjectKey);
                setAppData(data);

                if (!data) return;

                const totalPaiements = data.payments.reduce((acc, p) => acc + p.amount, 0);
                setTotal(totalPaiements);

                const totaux = {};
                data.families.forEach(family => {
                    totaux[family.id] = data.payments
                        .filter(p => p.familyId === family.id)
                        .reduce((acc, p) => acc + p.amount, 0);
                });

                setTotauxParFamille(totaux);
            };

            fetchData();
        }, [])
    );

    const toggleFamily = (familyId) => {
        setOpenFamilies(prev => ({
            ...prev,
            [familyId]: !prev[familyId]
        }));
    };

    if (!appData) {
        return (
            <View style={styles.container}>
                <Text>Chargement des données...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Rapport des paiements</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total des paiements</Text>
                <Text style={styles.totalAmount}>{total.toLocaleString()} AR</Text>
            </View>

            <Text style={styles.subtitle}>Total par famille :</Text>

            {appData.families.map(family => {
                const isOpen = openFamilies[family.id];
                const membres = appData.members.filter(m => m.familyId === family.id);

                return (
                    <View key={family.id} style={styles.accordionContainer}>
                        <TouchableOpacity onPress={() => toggleFamily(family.id)} style={styles.card}>
                            <View style={styles.familyRow}>
                                <Ionicons
                                    name={isOpen ? 'chevron-down-outline' : 'chevron-forward-outline'}
                                    size={20}
                                    color="#555"
                                    style={styles.chevron}
                                />
                                <Text style={styles.familyName}>{family.name}</Text>
                            </View>
                            <Text style={styles.familyAmount}>
                                {(totauxParFamille[family.id]).toLocaleString() ?? 0} AR
                            </Text>
                        </TouchableOpacity>


                        {isOpen && (
                            <View style={styles.membresContainer}>
                                {membres.map(member => {
                                    const totalMembre = appData.payments
                                        .filter(p => p.memberId === member.id)
                                        .reduce((acc, p) => acc + p.amount, 0);

                                    return (
                                        <View key={member.id} style={styles.membreItem}>
                                            <Text style={styles.membreName}>{member.name}</Text>
                                            <Text style={styles.membreAmount}>{totalMembre.toLocaleString()} AR</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    familyRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    chevron: {
        marginRight: 8,
    },

    container: {
        paddingTop: 50,
        padding: 20,
        backgroundColor: '#f8f9fa',
        minHeight: '100%',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        color: '#333',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 30,
        marginBottom: 10,
        color: '#444',
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 5,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#222',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#4068a1',
    },
    familyName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    familyAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4068a1',
    },
    accordionContainer: {
        marginBottom: 10,
    },
    membresContainer: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingBottom: 10,
        backgroundColor: '#f0f2f5',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    membreItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    membreName: {
        fontSize: 14,
        color: '#333',
    },
    membreAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4068a1',
    },
});
