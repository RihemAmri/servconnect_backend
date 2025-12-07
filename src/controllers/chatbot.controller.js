import * as fuzzy from "fuzzball";


function isSimilar(question, keywords) {
    question = question.toLowerCase();

    return keywords.some(keyword => {
        const kw = keyword.toLowerCase();
        if (question.includes(kw)) return true;

        const score = fuzzy.partial_ratio(question, kw);
        return score >= 80;
    });
}

export const askChatbot = (req, res) => {  // au lieu de exports.askChatbot
    const { text, userName } = req.body;
    const q = text?.toLowerCase() || "";
    let reply = "";

    // ---- Pour les CLIENTS ----
    if (isSimilar(q, ["comment trouver un prestataire", "trouver prestataire", "recherche prestataire"])) {
        reply = "Pour trouver un prestataire, utilisez la barre de recherche, choisissez un service et filtrez par localisation.";
    }
    else if (isSimilar(q, ["comparer prestataires", "comparer profils", "difference prestataires"])) {
        reply = "Vous pouvez comparer les prestataires selon leurs tarifs, notes, avis, expériences et photos de réalisations.";
    }
    else if (isSimilar(q, ["comment reserver", "reservation", "prendre rendez-vous"])) {
        reply = "Pour réserver, choisissez un prestataire → consultez son profil → cliquez sur 'Réserver' → validez selon la disponibilité.";
    }
    else if (isSimilar(q, ["avis", "note", "fiable", "sécurité"])) {
        reply = "La plateforme affiche les avis, notes et profils vérifiés pour garantir la fiabilité des prestataires.";
    }
    else if (isSimilar(q, ["prix", "tarif", "cout service", "combien ca coute"])) {
        reply = "Les prix sont affichés clairement dans chaque profil prestataire pour éviter les malentendus.";
    }
    else if (isSimilar(q, ["gagner du temps", "rapide", "simple"])) {
        reply = "ServConnect vous permet de trouver et réserver un prestataire en quelques clics seulement.";
    }

    // ---- Pour les PRESTATAIRES ----
    else if (isSimilar(q, ["comment avoir des clients", "trouver clients", "attirer clients","clients","client"])) {
        reply = "Créez un profil complet avec photos, tarifs et description pour augmenter vos chances d'obtenir des missions.";
    }
    else if (isSimilar(q, ["visibilité", "mettre en avant", "profil prestataire"])) {
        reply = "Votre profil public vous donne de la visibilité et permet aux clients de vous contacter directement.";
    }
    else if (isSimilar(q, ["notification", "mission", "demande service"])) {
        reply = "Vous recevez une notification lorsqu'un client vous contacte ou réserve un service. Vous pouvez accepter ou refuser.";
    }
    else if (isSimilar(q, ["statistiques", "revenu", "activité", "performances"])) {
        reply = "Un tableau de bord permet de suivre vos revenus, missions réalisées et taux d’acceptation.";
    }
    else if (isSimilar(q, ["fideliser", "clients fidèles", "gardez clients"])) {
        reply = "Les avis, notes et historiques des prestations vous aident à fidéliser vos clients.";
    }

    // ---- Général ----
    else if (isSimilar(q, ["c'est quoi servconnect", "serveconnect", "a propos"])) {
        reply = "ServConnect met en relation clients et prestataires pour divers services (réparation, ménage, beauté...).";
    }
    else if (isSimilar(q, ["bonjour", "salut", "coucou", "bonsoir","hello","hi"])) {
        reply = `Bonjour ${userName ?? ""} 👋 ! Comment puis-je vous aider ?`;
    }
    else if (isSimilar(q, ["merci", "thanks"])) {
        reply = "Avec plaisir 😊 Si tu as d'autres questions, je suis là !";
    }
    else {
        reply = "Je n’ai pas bien compris 🤔 Reformule ta question.";
    }

    res.json({ reply });
};
