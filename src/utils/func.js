export function convertToNoSQL(data) {
    // Sécurité : valeur par défaut si vide ou invalide
    const families = Array.isArray(data?.families) ? data.families : [];
    const members = Array.isArray(data?.members) ? data.members : [];
    const payments = Array.isArray(data?.payments) ? data.payments : [];

    // Regrouper les paiements par membre
    const paymentsByMember = {};
    for (const payment of payments) {
        if (!paymentsByMember[payment.memberId]) {
            paymentsByMember[payment.memberId] = [];
        }
        paymentsByMember[payment.memberId].push(payment);
    }

    // Regrouper les membres par famille avec leurs paiements
    const membersByFamily = {};
    for (const member of members) {
        const memberWithPayments = {
            id: member.id,
            name: member.name,
            payments: paymentsByMember[member.id] || []
        };

        if (!membersByFamily[member.familyId]) {
            membersByFamily[member.familyId] = [];
        }
        membersByFamily[member.familyId].push(memberWithPayments);
    }

    // Construire la structure finale
    return {
        families: families.map(family => ({
            id: family.id,
            name: family.name,
            members: membersByFamily[family.id] || []
        }))
    };
}
