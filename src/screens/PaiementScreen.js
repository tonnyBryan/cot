import React, {useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View,} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {loadAppData, saveAppData} from '../utils/storage';
import {MONTANT_HEBDOMADAIRE_PAR_MEMBRE, DEVIS} from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';



export default function PaiementScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const [montantPaye, setMontantPaye] = useState('');
    const [paiementsExistants, setPaiementsExistants] = useState([]);
    const [totalPaiement, setTotalPaiement] = useState(0);

    const montantNormal = MONTANT_HEBDOMADAIRE_PAR_MEMBRE;

    useEffect(() => {
        const fetchPaiements = async () => {
            const data = await loadAppData();

            const paiements = data.payments.filter(
                p => p.memberId === memberId && p.week === week
            );
            setPaiementsExistants(paiements);
            const totalPaye = paiements.reduce((sum, p) => sum + parseInt(p.amount), 0);
            setTotalPaiement(totalPaye);

        };

        fetchPaiements();
    }, []);


    const { memberId, memberName, familyName, familyId, week } = route.params;

    const getWeekDateRange = (weekNumber) => {
        const year = new Date().getFullYear();
        const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        const start = new Date(ISOweekStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
    };

    const { start, end } = getWeekDateRange(week);

    const payerNormal = async (montant) => {
        try {
            const data = await loadAppData();

            const newPayment = {
                id: Date.now().toString(),
                memberId,
                familyId,
                week,
                amount: montant,
                date: new Date().toISOString(),
            };

            const updatedPayments = [...data.payments, newPayment];

            const updatedAppData = {
                ...data,
                payments: updatedPayments,
            };

            await saveAppData(updatedAppData);

        } catch (error) {
            console.error('Erreur lors de l’enregistrement du paiement :', error);
        }
    };

    const payerEtendre = async (montant) => {
        try {
            const data = await loadAppData();

            let reste = montant;
            let currentWeek = week;
            const payments = [...data.payments];

            while (reste > 0) {
                // Calcule le montant déjà payé pour ce membre à cette semaine
                const montantPaye = payments
                    .filter(p => p.memberId === memberId && p.week === currentWeek)
                    .reduce((sum, p) => sum + p.amount, 0);

                const montantManquant = montantNormal - montantPaye;

                if (montantManquant > 0) {
                    const montantAPayer = Math.min(reste, montantManquant);

                    const newPayment = {
                        id: Date.now().toString() + '-' + currentWeek, // id unique même pour plusieurs paiements
                        memberId,
                        familyId,
                        week: currentWeek,
                        amount: montantAPayer,
                        date: new Date().toISOString(),
                    };

                    payments.push(newPayment);
                    reste -= montantAPayer;
                }

                currentWeek += 1; // Semaine suivante
            }

            const updatedAppData = {
                ...data,
                payments,
            };

            await saveAppData(updatedAppData);
        } catch (error) {
            console.error('Erreur lors de l’enregistrement du paiement étendu :', error);
        }
    };


    const handlePaiement = async () => {
        let montant = parseInt(montantPaye.replace(/\s/g, ''));

        if (isNaN(montant) || montant < 100) {
            Alert.alert('Erreur', 'Veuillez entrer un montant valide (minimum 100)');
            return;
        }

        // Si le montant n'est pas un multiple de 100, proposer d'arrondir
        if (montant % 100 !== 0) {
            const montantBas = Math.floor(montant / 100) * 100;
            const montantHaut = montantBas + 100;

            Alert.alert(
                'Montant non valide',
                `Le montant doit être un multiple de 100.\nChoisissez un montant arrondi :`,
                [
                    {
                        text: 'Annuler',
                        style: 'cancel'
                    },
                    {
                        text: `${montantBas}`,
                        onPress: () => handlePaiementArrondi(montantBas)
                    },
                    {
                        text: `${montantHaut}`,
                        onPress: () => handlePaiementArrondi(montantHaut)
                    }
                ]
            );
        } else {
            handlePaiementArrondi(montant);
        }
    };

    const handlePaiementArrondi = async (montant) => {
        try {
            const data = await loadAppData();
            const resteAPayer = montantNormal - totalPaiement;

            if (montant <= resteAPayer) {
                await payerNormal(montant);
                Alert.alert('Paiement enregistré', `Montant: ${montant} ${DEVIS}`);
                navigation.goBack();
            } else {
                let montantRestant = montant;
                let semaineCourante = week;
                let semainesCompletes = 0;

                while (montantRestant > 0) {
                    const paiementsSemaine = data.payments
                        .filter(p => p.memberId === memberId && p.week === semaineCourante)
                        .reduce((sum, p) => sum + p.amount, 0);

                    const resteSemaine = montantNormal - paiementsSemaine;
                    if (resteSemaine <= 0) {
                        semaineCourante++;
                        continue;
                    }

                    if (montantRestant >= resteSemaine) {
                        montantRestant -= resteSemaine;
                        semainesCompletes++;
                    } else {
                        montantRestant = 0;
                    }

                    semaineCourante++;
                }

                Alert.alert(
                    'Confirmation',
                    `Ce montant permet de compléter jusqu'à ${semainesCompletes} semaine${semainesCompletes > 1 ? 's' : ''}. Voulez-vous continuer ?`,
                    [
                        { text: 'Annuler', style: 'cancel' },
                        {
                            text: 'Confirmer',
                            onPress: async () => {
                                await payerEtendre(montant);
                                Alert.alert('Paiement enregistré', `Montant: ${montant} ${DEVIS}`);
                                navigation.goBack();
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error("Erreur lors du traitement du paiement :", error);
            Alert.alert("Erreur", "Une erreur est survenue lors du paiement.");
        }
    };



    const formatDate = (date) =>
        date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const formatMontant = (text) => {
        const numericText = text.replace(/\D/g, '');

        const number = parseInt(numericText, 10);

        if (isNaN(number)) {
            setMontantPaye('');
            return;
        }

        const formatted = number.toLocaleString('fr-FR').replace(/\s/g, ' ');

        setMontantPaye(formatted);
    };


    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* Infos du membre */}
            <View style={styles.card}>
                <Text style={styles.label}>Membre</Text>
                <Text style={styles.value}>{memberName}</Text>

                <Text style={styles.label}>Famille</Text>
                <Text style={styles.value}>{familyName}</Text>

                <Text style={styles.label}>Semaine</Text>
                <Text style={styles.value}>
                    {formatDate(start)} - {formatDate(end)}
                </Text>


                <Text style={styles.label}>Montant à payer par semaine</Text>
                <Text style={[styles.value, styles.amount]}>{montantNormal.toLocaleString()} {DEVIS}</Text>
            </View>

            {/* Input de paiement */}
            {totalPaiement < montantNormal && (
                <>
                    <View style={styles.card}>
                        <Text style={styles.label}>Entrez le montant que vous souhaitez enregistrer</Text>

                        <View style={{ position: 'relative', width: '100%' }}>
                            <TextInput
                                style={[styles.input, { paddingRight: 40 }]} // espace à droite pour le texte
                                placeholder="0"
                                keyboardType="numeric"
                                value={montantPaye}
                                onChangeText={formatMontant}
                                placeholderTextColor="#999"
                            />
                            <Text
                                style={ styles.inputUnit }
                            >
                                AR
                            </Text>
                        </View>



                        <View style={styles.remainingContainer}>
                            <Ionicons name="alert-circle-outline" size={18} color="#dc3545" />
                            <Text style={styles.remainingText}>
                                Reste à payer : {(montantNormal - totalPaiement).toLocaleString()} {DEVIS}
                            </Text>
                        </View>
                    </View>

                    <Pressable style={styles.payButton} onPress={handlePaiement}>
                        <Text style={styles.payButtonText}>Enregistrer le paiement</Text>
                    </Pressable>
                </>
            )}

            {paiementsExistants.length > 0 && (
                <View style={[styles.card , {marginBottom: 60}]}>
                    <Text style={styles.label}>Historique des paiements</Text>

                    {paiementsExistants.map(p => (
                        <View key={p.id} style={styles.paiementItem}>
                            <Text style={{ color: '#888' }}>
                                {new Date(p.date).toLocaleDateString('fr-FR')}
                            </Text>
                            <Text style={styles.value}>
                                {parseInt(p.amount).toLocaleString()} {DEVIS}
                            </Text>
                        </View>
                    ))}

                    {/* Total */}
                    <View style={[styles.paiementItem, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }]}>
                        <Text style={[styles.value, { fontWeight: 'bold' }]}>Total</Text>
                        <Text style={[styles.value, { fontWeight: 'bold', color: '#4068a1' }]}>
                            {totalPaiement.toLocaleString()} {DEVIS}
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    inputUnit : {
        position: 'absolute',
        right: 10,
        top: 23,
        color: '#444',
        fontWeight: '600',
    },

    remainingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffecec',
        padding: 8,
        borderRadius: 8,
    },

    remainingText: {
        color: '#dc3545',
        fontSize: 15,
        marginLeft: 6,
        fontWeight: '500',
    },



    paiementItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },


    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f9f9f9',
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#4068a1',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#888',
        marginTop: 10,
    },
    value: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4068a1',
        marginTop: 5,
    },
    input: {
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 45,
        fontSize: 16,
    },
    payButton: {
        backgroundColor: '#4068a1',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
