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

export function regrouperParFamille(data) {
    const { families, members, payments } = data;

    const membresParFamille = {};

    members.forEach((membre) => {
        if (!membresParFamille[membre.familyId]) {
            membresParFamille[membre.familyId] = [];
        }

        const total = payments
            .filter((p) => p.memberId === membre.id)
            .reduce((sum, p) => sum + p.amount, 0);

        membresParFamille[membre.familyId].push({
            nom: membre.name,
            totalPaiements: total
        });
    });

    return families.map((famille) => {
        const membres = membresParFamille[famille.id] || [];

        const totalFamille = membres.reduce(
            (somme, membre) => somme + membre.totalPaiements,
            0
        );

        return {
            nom: famille.name,
            totalPaiements: totalFamille,
            membres
        };
    });
}
