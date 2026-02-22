// ───────────────────────────────────────────────────────
// AB DRIDI — Chatbot DRIBI Knowledge Base & Response Engine
// ───────────────────────────────────────────────────────

export const knowledgeBase = {
  site: {
    name: 'AB DRIDI',
    url: 'portal.abdridi.com',
    description: 'Plateforme de veille et d\'accompagnement sur les marchés publics français',
    contact: 'contact@abdridi.com',
    horaires: 'Lundi au Samedi, 8h00 à 18h00',
  },
  abonnements: {
    decouverte: {
      nom: 'Découverte',
      prix: 'Gratuit',
      avantages: [
        '3 appels d\'offres visibles par jour',
        'Recherche basique',
        'Accès aux 93 sources officielles',
        'Prise de rendez-vous accompagnement',
      ],
      limites: [
        'Résultats floutés au-delà de 3',
        'Pas d\'alertes email',
        'Pas de veille concurrentielle',
        'Pas d\'export de données',
      ],
    },
    veille: {
      nom: 'Veille & Accompagnement',
      prix: '25,90€/mois',
      avantages: [
        'Appels d\'offres illimités',
        'Résultats en temps réel',
        'Alertes email personnalisées',
        'Veille concurrentielle complète',
        'Export CSV/Excel',
        'Tous les filtres avancés',
        'Prise de rendez-vous accompagnement',
        'Support prioritaire',
      ],
    },
  },
  pages: {
    consultations: 'La page Consultations permet de rechercher les appels d\'offres en cours. Utilisez la barre de recherche pour trouver des marchés par mot-clé. Vous pouvez aussi filtrer par région, type de marché, et montant.',
    concurrence: 'La page Concurrence montre les marchés publics déjà attribués. Vous pouvez voir quelle entreprise a remporté chaque marché, le montant, et l\'acheteur. Utile pour analyser vos concurrents.',
    alertes: 'La page Alertes vous permet de configurer des notifications email automatiques. Dès qu\'un nouveau marché correspondant à vos critères est publié, vous recevez un email. Disponible avec l\'abonnement Veille.',
    rendezvous: 'La page Rendez-vous liste vos demandes d\'accompagnement. Vous pouvez prendre RDV directement depuis la page d\'un marché qui vous intéresse.',
    abonnement: 'La page Abonnement vous permet de choisir votre formule : Découverte (gratuit, 3 marchés/jour) ou Veille & Accompagnement (25,90€/mois, tout illimité).',
    admin: 'Réservée aux administrateurs, cette page affiche les statistiques du portail et la gestion des utilisateurs.',
  },
  marchesPublics: {
    definition: 'Un marché public est un contrat passé par un organisme public (État, collectivités, hôpitaux...) pour acheter des travaux, fournitures ou services. Les entreprises privées peuvent y répondre.',
    types: 'Il existe plusieurs types : marchés de travaux (construction, rénovation), marchés de fournitures (équipements, matériel), et marchés de services (conseil, maintenance, nettoyage, informatique, transport).',
    procedures: 'Les principales procédures sont : l\'appel d\'offres ouvert (tout le monde peut candidater), l\'appel d\'offres restreint (présélection), la procédure adaptée (MAPA, pour les petits montants), et le dialogue compétitif.',
    seuils: 'Les seuils 2024-2025 : MAPA sous 40 000€ HT (procédure libre), de 40 000€ à 221 000€ HT pour l\'État ou 221 000€ pour les collectivités (procédure adaptée), au-dessus c\'est procédure formalisée.',
    dce: 'Le DCE (Dossier de Consultation des Entreprises) contient tous les documents nécessaires pour répondre : le règlement de consultation (RC), le cahier des charges (CCTP), l\'acte d\'engagement (AE), le BPU, le DPGF, etc.',
    repondre: 'Pour répondre à un appel d\'offres : 1) Trouvez le marché qui vous intéresse. 2) Téléchargez le DCE. 3) Lisez attentivement le règlement de consultation. 4) Préparez votre dossier (documents administratifs + offre technique + offre financière). 5) Déposez votre réponse avant la date limite sur la plateforme de dématérialisation indiquée.',
    delais: 'Les délais de réponse varient : minimum 30 jours pour un appel d\'offres ouvert européen, 22 jours minimum pour une procédure adaptée. Consultez toujours la date limite indiquée dans l\'avis.',
    documentsAdmin: 'Documents administratifs souvent demandés : DC1 (lettre de candidature), DC2 (déclaration du candidat), attestations fiscales et sociales, Kbis de moins de 3 mois, attestation d\'assurance, références de marchés similaires.',
    conseils: [
      'Lisez TOUJOURS le règlement de consultation en premier. Il contient les critères de notation, les documents demandés, et les conditions de participation.',
      'Soignez votre mémoire technique. C\'est souvent le critère le plus important (60-70% de la note). Soyez précis, concret, et montrez que vous comprenez le besoin.',
      'Respectez scrupuleusement les délais et les formats demandés. Un dossier en retard ou incomplet est éliminé automatiquement.',
      'N\'hésitez pas à poser des questions à l\'acheteur via la plateforme de dématérialisation. Les réponses sont publiques et peuvent vous donner un avantage.',
      'Analysez les marchés précédents de l\'acheteur (via notre page Concurrence) pour comprendre ses habitudes et les prix pratiqués.',
    ],
  },
  sources: {
    description: 'AB DRIDI agrège 93 sources officielles dont le BOAMP (Bulletin Officiel des Annonces de Marchés Publics), les plateformes de dématérialisation régionales, et le TED (marchés européens).',
    boamp: 'Le BOAMP est la source officielle française pour les avis de marchés publics. Tous les marchés au-dessus de 40 000€ HT y sont publiés.',
    decp: 'Les DECP (Données Essentielles de la Commande Publique) recensent les contrats attribués, permettant de savoir qui a gagné quel marché et à quel prix.',
  },
  accompagnement: {
    description: 'Notre service d\'accompagnement vous aide à répondre aux appels d\'offres. Prenez rendez-vous directement depuis la page d\'un marché pour un accompagnement personnalisé.',
    services: 'Nous proposons : le montage complet de dossier de A à Z, la stratégie de réponse (analyse des chances, positionnement prix), la relecture et optimisation de mémoire technique, et la veille personnalisée.',
    rdv: 'Pour prendre rendez-vous : allez sur la page d\'un marché qui vous intéresse, en bas vous trouverez le formulaire de prise de RDV. Choisissez une date du lundi au samedi et un créneau entre 8h et 18h.',
    tarif: 'L\'accompagnement se fait sur devis personnalisé après un premier rendez-vous gratuit de diagnostic.',
  },
};

// ───────────────────────────────────────────
// Categories with weighted keywords + response variants
// ───────────────────────────────────────────

type Category = {
  name: string;
  keywords: { word: string; weight: number }[];
  responses: (() => string)[];
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pick2or3Conseils(): string {
  const shuffled = [...knowledgeBase.marchesPublics.conseils].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
  return picked.map((c, i) => `${i + 1}. ${c}`).join('\n\n');
}

const categories: Category[] = [
  {
    name: 'SALUTATION',
    keywords: [
      { word: 'bonjour', weight: 3 }, { word: 'salut', weight: 3 }, { word: 'hello', weight: 3 },
      { word: 'hey', weight: 3 }, { word: 'coucou', weight: 3 }, { word: 'bonsoir', weight: 3 },
    ],
    responses: [
      () => 'Bonjour ! 👋 Je suis Dribi, votre assistant AB DRIDI. Je peux vous aider sur les marchés publics, l\'utilisation du portail, ou la prise de rendez-vous. Que puis-je faire pour vous ?',
      () => 'Bonjour et bienvenue ! 😊 Je suis Dribi. Posez-moi vos questions sur les appels d\'offres, les abonnements, ou l\'accompagnement. Je suis là pour vous aider !',
      () => 'Salut ! 👋 Dribi à votre service. Besoin d\'aide sur les marchés publics, votre abonnement, ou un rendez-vous ? N\'hésitez pas !',
    ],
  },
  {
    name: 'ABONNEMENT_PRIX',
    keywords: [
      { word: 'abonnement', weight: 3 }, { word: 'prix', weight: 3 }, { word: 'tarif', weight: 3 },
      { word: 'cout', weight: 3 }, { word: 'combien', weight: 3 }, { word: 'payer', weight: 3 },
      { word: 'gratuit', weight: 3 }, { word: 'formule', weight: 2 }, { word: 'plan', weight: 2 },
      { word: 'souscrire', weight: 2 }, { word: 'offre', weight: 1 },
    ],
    responses: [
      () => `Nous proposons 2 formules :\n\n**${knowledgeBase.abonnements.decouverte.nom} (${knowledgeBase.abonnements.decouverte.prix})** :\n${knowledgeBase.abonnements.decouverte.avantages.map(a => `• ${a}`).join('\n')}\n\n**${knowledgeBase.abonnements.veille.nom} (${knowledgeBase.abonnements.veille.prix})** :\n${knowledgeBase.abonnements.veille.avantages.map(a => `• ${a}`).join('\n')}\n\nRendez-vous sur la page **Abonnement** pour souscrire !`,
      () => `Voici nos offres :\n\n🆓 **Découverte** — Gratuit : 3 appels d'offres/jour, recherche basique, prise de RDV.\n\n⭐ **Veille & Accompagnement** — 25,90€/mois : tout illimité, alertes email, concurrence, export, support prioritaire.\n\nVous pouvez souscrire depuis la page Abonnement.`,
      () => `Le portail AB DRIDI propose 2 plans :\n\n• **Découverte** : gratuit, 3 marchés visibles/jour, résultats floutés au-delà.\n• **Veille & Accompagnement** : 25,90€/mois, accès illimité à tout le portail + support prioritaire.\n\nAllez sur la page Abonnement pour en savoir plus.`,
    ],
  },
  {
    name: 'CONSULTATIONS',
    keywords: [
      { word: 'consultation', weight: 2 }, { word: 'marche', weight: 2 }, { word: 'appel', weight: 2 },
      { word: 'offre', weight: 1 }, { word: 'recherche', weight: 2 }, { word: 'chercher', weight: 2 },
      { word: 'trouver', weight: 2 }, { word: 'mot-cle', weight: 2 }, { word: 'filtre', weight: 1 },
    ],
    responses: [
      () => `${knowledgeBase.pages.consultations}\n\nLes résultats proviennent de **93 sources officielles** (BOAMP, TED, DECP). Pour des recherches illimitées, passez au plan Veille & Accompagnement.`,
      () => `Pour trouver des marchés :\n1. Allez sur la page **Consultations**\n2. Tapez un mot-clé (ex: "nettoyage", "informatique")\n3. Utilisez les filtres (nature, département, montant)\n\nAvec le plan gratuit, vous voyez 3 résultats/jour. Le plan Veille débloque tout !`,
      () => `La recherche de marchés est simple : utilisez la page **Consultations** pour filtrer par mot-clé, nature (travaux, services, fournitures), département et montant. Les données proviennent de 93 sources officielles françaises et européennes.`,
    ],
  },
  {
    name: 'CONCURRENCE',
    keywords: [
      { word: 'concurrence', weight: 2 }, { word: 'concurrent', weight: 2 }, { word: 'attribution', weight: 2 },
      { word: 'attribue', weight: 2 }, { word: 'gagne', weight: 2 }, { word: 'remporte', weight: 2 },
      { word: 'titulaire', weight: 2 }, { word: 'qui a eu', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.pages.concurrence}\n\nAvec le plan gratuit, vous pouvez voir 3 attributions. Le plan **Veille** (25,90€/mois) débloque l'intégralité de l'analyse concurrentielle.`,
      () => `L'analyse concurrentielle est disponible sur la page **Concurrence**. Vous y trouverez :\n• Les entreprises qui remportent les marchés\n• Les montants attribués\n• Les acheteurs publics\n\nC'est un outil puissant pour positionner votre offre !`,
      () => `La veille concurrentielle vous permet de savoir qui remporte quoi, à quel prix. Très utile pour analyser le marché et ajuster votre stratégie de réponse. Accessible en version complète avec le plan Veille & Accompagnement.`,
    ],
  },
  {
    name: 'ALERTES',
    keywords: [
      { word: 'alerte', weight: 2 }, { word: 'notification', weight: 2 }, { word: 'email', weight: 1 },
      { word: 'prevenir', weight: 2 }, { word: 'automatique', weight: 1 }, { word: 'veille', weight: 1 },
    ],
    responses: [
      () => `${knowledgeBase.pages.alertes}\n\nVous ne raterez plus aucune opportunité grâce aux alertes automatiques !`,
      () => `Les **alertes email** vous notifient automatiquement quand un nouvel appel d'offres correspond à vos critères. Configurez-les depuis la page Alertes.\n\n📧 Disponible avec le plan **Veille & Accompagnement** (25,90€/mois).`,
    ],
  },
  {
    name: 'RDV',
    keywords: [
      { word: 'rendez-vous', weight: 3 }, { word: 'rdv', weight: 3 }, { word: 'accompagnement', weight: 2 },
      { word: 'montage', weight: 2 }, { word: 'dossier', weight: 1 }, { word: 'aide', weight: 1 },
      { word: 'aider', weight: 1 }, { word: 'ensemble', weight: 1 }, { word: 'guider', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.accompagnement.description}\n\n${knowledgeBase.accompagnement.rdv}\n\n${knowledgeBase.accompagnement.tarif}`,
      () => `Besoin d'aide pour répondre à un appel d'offres ? 📋\n\n${knowledgeBase.accompagnement.services}\n\nPour prendre RDV : ouvrez la page d'un marché et utilisez le formulaire en bas. Créneaux disponibles du lundi au samedi, 8h-18h.`,
      () => `Notre service d'accompagnement est accessible à tous, gratuits et payants !\n\n📅 Pour prendre rendez-vous :\n1. Ouvrez la page d'un marché\n2. En bas, remplissez le formulaire (date + créneau)\n3. On vous recontacte rapidement !\n\nPremier diagnostic gratuit.`,
    ],
  },
  {
    name: 'PROCEDURE',
    keywords: [
      { word: 'procedure', weight: 2 }, { word: 'comment repondre', weight: 3 }, { word: 'demarche', weight: 2 },
      { word: 'etape', weight: 2 }, { word: 'candidater', weight: 2 }, { word: 'soumissionner', weight: 2 },
      { word: 'postuler', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.repondre}\n\n⏱ ${knowledgeBase.marchesPublics.delais}`,
      () => `Voici les étapes pour répondre à un appel d'offres :\n\n${knowledgeBase.marchesPublics.repondre}\n\n💡 Conseil : utilisez notre page Concurrence pour analyser les prix pratiqués.`,
    ],
  },
  {
    name: 'DCE',
    keywords: [
      { word: 'dce', weight: 2 }, { word: 'dossier consultation', weight: 2 }, { word: 'cahier des charges', weight: 2 },
      { word: 'cctp', weight: 2 }, { word: 'reglement', weight: 2 }, { word: 'document', weight: 1 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.dce}\n\n💡 Astuce : le RC (Règlement de Consultation) est le document le plus important. Lisez-le en premier !`,
      () => `Le **DCE** (Dossier de Consultation des Entreprises) est le dossier que vous téléchargez pour répondre. Il contient :\n\n• **RC** — Règlement de Consultation (à lire en premier !)\n• **CCTP** — Cahier des charges technique\n• **AE** — Acte d'engagement\n• **BPU / DPGF** — Bordereaux de prix\n\nTout se télécharge depuis la plateforme de l'acheteur.`,
    ],
  },
  {
    name: 'SEUILS',
    keywords: [
      { word: 'seuil', weight: 2 }, { word: 'montant', weight: 1 }, { word: 'mapa', weight: 2 },
      { word: 'europeen', weight: 2 }, { word: 'procedure adaptee', weight: 2 }, { word: 'formalisee', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.seuils}\n\n💡 Les MAPA (< 40 000€) sont souvent les plus accessibles pour les petites entreprises.`,
      () => `Les seuils déterminent la procédure à suivre :\n\n• **< 40 000€ HT** : procédure libre (MAPA simplifié)\n• **40 000€ — 221 000€** : procédure adaptée (MAPA)\n• **> 221 000€** : procédure formalisée (appel d'offres)\n\nPlus le montant est élevé, plus la procédure est encadrée.`,
    ],
  },
  {
    name: 'DOCUMENTS',
    keywords: [
      { word: 'dc1', weight: 2 }, { word: 'dc2', weight: 2 }, { word: 'kbis', weight: 2 },
      { word: 'attestation', weight: 2 }, { word: 'document administratif', weight: 2 },
      { word: 'piece', weight: 1 }, { word: 'formulaire', weight: 1 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.documentsAdmin}\n\n📋 Préparez ces documents à l'avance pour gagner du temps sur vos réponses !`,
      () => `Les documents administratifs les plus demandés :\n\n• **DC1** — Lettre de candidature\n• **DC2** — Déclaration du candidat\n• **Kbis** de moins de 3 mois\n• Attestations fiscales et sociales\n• Attestation d'assurance\n• Références de marchés similaires\n\nAstuce : gardez un dossier "pré-rempli" avec tous ces documents à jour.`,
    ],
  },
  {
    name: 'CONSEILS',
    keywords: [
      { word: 'conseil', weight: 2 }, { word: 'astuce', weight: 2 }, { word: 'tip', weight: 2 },
      { word: 'recommandation', weight: 2 }, { word: 'ameliorer', weight: 2 }, { word: 'gagner', weight: 2 },
      { word: 'remporter', weight: 2 }, { word: 'chance', weight: 2 }, { word: 'optimiser', weight: 2 },
      { word: 'memoire technique', weight: 3 },
    ],
    responses: [
      () => `Voici mes meilleurs conseils pour remporter des marchés publics :\n\n${pick2or3Conseils()}`,
      () => `Pour maximiser vos chances :\n\n${pick2or3Conseils()}\n\n💡 Besoin d'aide personnalisée ? Prenez un rendez-vous d'accompagnement depuis la page d'un marché !`,
    ],
  },
  {
    name: 'SOURCES',
    keywords: [
      { word: 'source', weight: 2 }, { word: 'boamp', weight: 2 }, { word: 'ted', weight: 2 },
      { word: 'decp', weight: 2 }, { word: 'plateforme', weight: 1 }, { word: 'ou trouver', weight: 2 },
      { word: 'base de donnees', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.sources.description}\n\n• **BOAMP** : ${knowledgeBase.sources.boamp}\n• **DECP** : ${knowledgeBase.sources.decp}`,
      () => `Nos données proviennent de **93 sources officielles** :\n\n📋 **BOAMP** — Bulletin Officiel des Annonces des Marchés Publics (source principale française)\n🇪🇺 **TED** — Tenders Electronic Daily (marchés européens)\n📊 **DECP** — Données Essentielles de la Commande Publique (marchés attribués)\n+ plateformes de dématérialisation régionales`,
    ],
  },
  {
    name: 'TYPES_MARCHES',
    keywords: [
      { word: 'type', weight: 1 }, { word: 'travaux', weight: 2 }, { word: 'fourniture', weight: 2 },
      { word: 'service', weight: 1 }, { word: 'categorie', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.types}\n\nUtilisez le filtre "Nature" sur la page Consultations pour affiner vos recherches.`,
      () => `Les marchés publics se divisent en 3 grandes catégories :\n\n🏗 **Travaux** — Construction, rénovation, voirie\n📦 **Fournitures** — Équipements, matériel, mobilier\n🔧 **Services** — Conseil, maintenance, informatique, transport\n\nVous pouvez filtrer par type sur le portail.`,
    ],
  },
  {
    name: 'DEFINITION',
    keywords: [
      { word: 'c\'est quoi', weight: 3 }, { word: 'definition', weight: 2 }, { word: 'qu\'est-ce', weight: 3 },
      { word: 'marche public', weight: 2 }, { word: 'expliquer', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.definition}\n\n${knowledgeBase.marchesPublics.types}`,
      () => `Un **marché public**, c'est un contrat entre un organisme public et une entreprise privée.\n\n${knowledgeBase.marchesPublics.definition}\n\n💡 C'est une vraie opportunité de business : des milliards d'euros de contrats sont publiés chaque année !`,
    ],
  },
  {
    name: 'CONTACT',
    keywords: [
      { word: 'contact', weight: 2 }, { word: 'joindre', weight: 2 }, { word: 'telephone', weight: 2 },
      { word: 'mail', weight: 1 }, { word: 'parler', weight: 1 }, { word: 'humain', weight: 2 },
      { word: 'quelqu\'un', weight: 2 },
    ],
    responses: [
      () => `Vous pouvez nous contacter à **contact@abdridi.com**.\n\nNotre équipe est disponible du lundi au samedi de 8h à 18h.\n\nVous pouvez aussi prendre rendez-vous directement depuis le portail pour un accompagnement personnalisé.`,
      () => `📧 **contact@abdridi.com**\n🕐 Lundi — Samedi, 8h00 - 18h00\n\nBesoin d'un accompagnement ? Prenez un rendez-vous directement depuis la page d'un marché. Notre équipe vous recontactera rapidement.`,
    ],
  },
  {
    name: 'MERCI',
    keywords: [
      { word: 'merci', weight: 3 }, { word: 'super', weight: 3 }, { word: 'parfait', weight: 3 },
      { word: 'genial', weight: 3 }, { word: 'top', weight: 3 }, { word: 'excellent', weight: 3 },
      { word: 'cool', weight: 3 },
    ],
    responses: [
      () => 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions. Je suis là pour vous aider ! 😊',
      () => 'Ravi d\'avoir pu vous aider ! 🙂 N\'hésitez pas à revenir vers moi si besoin.',
      () => 'Merci à vous ! Si vous avez d\'autres questions sur les marchés publics ou le portail, je suis toujours disponible. Bonne continuation ! 😊',
    ],
  },
];

const DEFAULT_RESPONSES = [
  () => 'Je comprends votre question mais je n\'ai pas de réponse précise. Voici ce que je peux vous aider sur :\n\n• **Recherche de marchés publics** — tapez "consultation"\n• **Abonnements et tarifs** — tapez "abonnement"\n• **Prise de rendez-vous** — tapez "rendez-vous"\n• **Procédures et conseils** — tapez "conseil"\n• **Concurrence** — tapez "concurrence"\n\nOu contactez notre équipe : **contact@abdridi.com**',
  () => 'Je ne suis pas sûr de comprendre. Je peux vous renseigner sur :\n\n📋 Les **consultations** et appels d\'offres\n💰 Les **abonnements** et tarifs\n📅 La prise de **rendez-vous**\n📊 L\'analyse de **concurrence**\n💡 Des **conseils** pour répondre aux marchés\n\nPosez-moi une question plus précise ou écrivez à **contact@abdridi.com**',
];

// ───────────────────────────────────────────
// Smart Response Engine
// ───────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Common typos
    .replace(/marcher public/g, 'marche public')
    .replace(/appel d'offre([^s])/g, "appel d'offres$1")
    .replace(/appel d offre/g, "appel d'offres")
    .trim();
}

export function findBestResponse(
  message: string,
  _history: { role: string; content: string }[] = []
): string {
  const input = normalize(message);
  const wordCount = message.trim().split(/\s+/).length;
  const isQuestion = /\?/.test(message) || /^(comment|pourquoi|quand|ou|quel|est-ce|combien|qui|qu)/.test(input);

  // Score each category
  const scores: { cat: Category; score: number }[] = [];

  for (const cat of categories) {
    let score = 0;
    for (const kw of cat.keywords) {
      const kwNorm = normalize(kw.word);
      if (input.includes(kwNorm)) {
        score += kw.weight;
      }
    }
    // Boost if it's a question
    if (isQuestion && score > 0) {
      score += 1;
    }
    if (score > 0) {
      scores.push({ cat, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return pickRandom(DEFAULT_RESPONSES)();
  }

  const topScore = scores[0].score;
  const topCategory = scores[0].cat;

  // If second category is close in score (within 1 point), combine
  if (scores.length > 1 && scores[1].score >= topScore - 1 && scores[1].cat.name !== topCategory.name) {
    const resp1 = pickRandom(topCategory.responses)();
    const resp2 = pickRandom(scores[1].cat.responses)();
    // For short messages, keep first response only
    if (wordCount < 5) {
      return resp1;
    }
    return `${resp1}\n\n---\n\n${resp2}`;
  }

  return pickRandom(topCategory.responses)();
}
