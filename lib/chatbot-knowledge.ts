// ───────────────────────────────────────────────────────
// AB DRIDI — Chatbot AB DRIDI IA Knowledge Base & Response Engine
// ───────────────────────────────────────────────────────

export const knowledgeBase = {
  site: {
    name: 'AB DRIDI',
    url: 'portal.abdridi.com',
    description: 'Plateforme de veille et d\'accompagnement sur les marches publics francais',
    contact: 'contact@abdridi.com',
    horaires: 'Lundi au Samedi, 8h00 a 18h00',
  },
  abonnements: {
    decouverte: {
      nom: 'Decouverte',
      prix: 'Gratuit',
      avantages: [
        '3 appels d\'offres visibles par jour',
        'Recherche basique',
        'Acces aux 96 sources officielles',
        'Prise de rendez-vous accompagnement',
      ],
      limites: [
        'Resultats floutes au-dela de 3',
        'Pas d\'alertes email',
        'Pas de veille concurrentielle',
        'Pas d\'export de donnees',
      ],
    },
    veille: {
      nom: 'Veille & Accompagnement',
      prix: '25,90 euros/mois',
      avantages: [
        'Appels d\'offres illimites',
        'Resultats en temps reel',
        'Alertes email personnalisees',
        'Veille concurrentielle complete',
        'Export CSV/Excel',
        'Tous les filtres avances',
        'Prise de rendez-vous accompagnement',
        'Support prioritaire',
      ],
    },
  },
  pages: {
    consultations: 'La page Consultations permet de rechercher les appels d\'offres en cours. Utilisez la barre de recherche pour trouver des marches par mot-cle. Vous pouvez aussi filtrer par region, type de marche, et montant.',
    concurrence: 'La page Concurrence montre les marches publics deja attribues. Vous pouvez voir quelle entreprise a remporte chaque marche, le montant, et l\'acheteur. Utile pour analyser vos concurrents.',
    alertes: 'La page Alertes vous permet de configurer des notifications email automatiques. Des qu\'un nouveau marche correspondant a vos criteres est publie, vous recevez un email. Disponible avec l\'abonnement Veille.',
    rendezvous: 'La page Rendez-vous liste vos demandes d\'accompagnement. Vous pouvez prendre RDV directement depuis la page d\'un marche qui vous interesse.',
    abonnement: 'La page Abonnement vous permet de choisir votre formule : Decouverte (gratuit, 3 marches/jour) ou Veille & Accompagnement (25,90 euros/mois, tout illimite).',
    admin: 'Reservee aux administrateurs, cette page affiche les statistiques du portail et la gestion des utilisateurs.',
  },
  marchesPublics: {
    definition: 'Un marche public est un contrat passe par un organisme public (Etat, collectivites, hopitaux...) pour acheter des travaux, fournitures ou services. Les entreprises privees peuvent y repondre.',
    types: 'Il existe plusieurs types : marches de travaux (construction, renovation), marches de fournitures (equipements, materiel), et marches de services (conseil, maintenance, nettoyage, informatique, transport).',
    procedures: 'Les principales procedures sont : l\'appel d\'offres ouvert (tout le monde peut candidater), l\'appel d\'offres restreint (preselection), la procedure adaptee (MAPA, pour les petits montants), et le dialogue competitif.',
    seuils: 'Les seuils 2024-2025 : MAPA sous 40 000 euros HT (procedure libre), de 40 000 euros a 221 000 euros HT pour l\'Etat ou 221 000 euros pour les collectivites (procedure adaptee), au-dessus c\'est procedure formalisee.',
    dce: 'Le DCE (Dossier de Consultation des Entreprises) contient tous les documents necessaires pour repondre : le reglement de consultation (RC), le cahier des charges (CCTP), l\'acte d\'engagement (AE), le BPU, le DPGF, etc.',
    repondre: 'Pour repondre a un appel d\'offres : 1) Trouvez le marche qui vous interesse. 2) Telechargez le DCE. 3) Lisez attentivement le reglement de consultation. 4) Preparez votre dossier (documents administratifs + offre technique + offre financiere). 5) Deposez votre reponse avant la date limite sur la plateforme de dematerialisation indiquee.',
    delais: 'Les delais de reponse varient : minimum 30 jours pour un appel d\'offres ouvert europeen, 22 jours minimum pour une procedure adaptee. Consultez toujours la date limite indiquee dans l\'avis.',
    documentsAdmin: 'Documents administratifs souvent demandes : DC1 (lettre de candidature), DC2 (declaration du candidat), attestations fiscales et sociales, Kbis de moins de 3 mois, attestation d\'assurance, references de marches similaires.',
    conseils: [
      'Lisez TOUJOURS le reglement de consultation en premier. Il contient les criteres de notation, les documents demandes, et les conditions de participation.',
      'Soignez votre memoire technique. C\'est souvent le critere le plus important (60-70% de la note). Soyez precis, concret, et montrez que vous comprenez le besoin.',
      'Respectez scrupuleusement les delais et les formats demandes. Un dossier en retard ou incomplet est elimine automatiquement.',
      'N\'hesitez pas a poser des questions a l\'acheteur via la plateforme de dematerialisation. Les reponses sont publiques et peuvent vous donner un avantage.',
      'Analysez les marches precedents de l\'acheteur (via notre page Concurrence) pour comprendre ses habitudes et les prix pratiques.',
    ],
  },
  sources: {
    description: 'AB DRIDI agrege 96 sources officielles dont le BOAMP (Bulletin Officiel des Annonces de Marches Publics), les plateformes de dematerialisation regionales, et le TED (marches europeens).',
    boamp: 'Le BOAMP est la source officielle francaise pour les avis de marches publics. Tous les marches au-dessus de 40 000 euros HT y sont publies.',
    decp: 'Les DECP (Donnees Essentielles de la Commande Publique) recensent les contrats attribues, permettant de savoir qui a gagne quel marche et a quel prix.',
  },
  accompagnement: {
    description: 'Notre service d\'accompagnement vous aide a repondre aux appels d\'offres. Prenez rendez-vous directement depuis la page d\'un marche pour un accompagnement personnalise.',
    services: 'Nous proposons : le montage complet de dossier de A a Z, la strategie de reponse (analyse des chances, positionnement prix), la relecture et optimisation de memoire technique, et la veille personnalisee.',
    rdv: 'Pour prendre rendez-vous : allez sur la page d\'un marche qui vous interesse, en bas vous trouverez le formulaire de prise de RDV. Choisissez une date du lundi au samedi et un creneau entre 8h et 18h.',
    tarif: 'L\'accompagnement se fait sur devis personnalise apres un premier rendez-vous gratuit de diagnostic.',
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
      () => 'Bonjour ! Je suis votre Assistant AB DRIDI. Je peux vous aider sur les marches publics, l\'utilisation du portail, ou la prise de rendez-vous. Que puis-je faire pour vous ?',
      () => 'Bonjour et bienvenue ! Je suis l\'Assistant AB DRIDI. Posez-moi vos questions sur les appels d\'offres, les abonnements, ou l\'accompagnement. Je suis la pour vous aider.',
      () => 'Bienvenue, Assistant AB DRIDI a votre service. Besoin d\'aide sur les marches publics, votre abonnement, ou un rendez-vous ? N\'hesitez pas.',
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
      () => `Nous proposons 2 formules :\n\n**${knowledgeBase.abonnements.decouverte.nom} (${knowledgeBase.abonnements.decouverte.prix})** :\n${knowledgeBase.abonnements.decouverte.avantages.map(a => `- ${a}`).join('\n')}\n\n**${knowledgeBase.abonnements.veille.nom} (${knowledgeBase.abonnements.veille.prix})** :\n${knowledgeBase.abonnements.veille.avantages.map(a => `- ${a}`).join('\n')}\n\nRendez-vous sur la page **Abonnement** pour souscrire.`,
      () => `Voici nos offres :\n\n**Decouverte** — Gratuit : 3 appels d'offres/jour, recherche basique, prise de RDV.\n\n**Veille & Accompagnement** — 25,90 euros/mois : tout illimite, alertes email, concurrence, export, support prioritaire.\n\nVous pouvez souscrire depuis la page Abonnement.`,
      () => `Le portail AB DRIDI propose 2 plans :\n\n- **Decouverte** : gratuit, 3 marches visibles/jour, resultats floutes au-dela.\n- **Veille & Accompagnement** : 25,90 euros/mois, acces illimite a tout le portail + support prioritaire.\n\nAllez sur la page Abonnement pour en savoir plus.`,
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
      () => `${knowledgeBase.pages.consultations}\n\nLes resultats proviennent de **96 sources officielles** (BOAMP, TED, DECP, e-marchespublics). Pour des recherches illimitees, passez au plan Veille & Accompagnement.`,
      () => `Pour trouver des marches :\n1. Allez sur la page **Consultations**\n2. Tapez un mot-cle (ex: "nettoyage", "informatique")\n3. Utilisez les filtres (nature, departement, montant)\n\nAvec le plan gratuit, vous voyez 3 resultats/jour. Le plan Veille debloque tout.`,
      () => `La recherche de marches est simple : utilisez la page **Consultations** pour filtrer par mot-cle, nature (travaux, services, fournitures), departement et montant. Les donnees proviennent de 96 sources officielles francaises et europeennes.`,
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
      () => `${knowledgeBase.pages.concurrence}\n\nAvec le plan gratuit, vous pouvez voir 3 attributions. Le plan **Veille** (25,90 euros/mois) debloque l'integralite de l'analyse concurrentielle.`,
      () => `L'analyse concurrentielle est disponible sur la page **Concurrence**. Vous y trouverez :\n- Les entreprises qui remportent les marches\n- Les montants attribues\n- Les acheteurs publics\n\nC'est un outil puissant pour positionner votre offre.`,
      () => `La veille concurrentielle vous permet de savoir qui remporte quoi, a quel prix. Tres utile pour analyser le marche et ajuster votre strategie de reponse. Accessible en version complete avec le plan Veille & Accompagnement.`,
    ],
  },
  {
    name: 'ALERTES',
    keywords: [
      { word: 'alerte', weight: 2 }, { word: 'notification', weight: 2 }, { word: 'email', weight: 1 },
      { word: 'prevenir', weight: 2 }, { word: 'automatique', weight: 1 }, { word: 'veille', weight: 1 },
    ],
    responses: [
      () => `${knowledgeBase.pages.alertes}\n\nVous ne raterez plus aucune opportunite grace aux alertes automatiques.`,
      () => `Les **alertes email** vous notifient automatiquement quand un nouvel appel d'offres correspond a vos criteres. Configurez-les depuis la page Alertes.\n\nDisponible avec le plan **Veille & Accompagnement** (25,90 euros/mois).`,
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
      () => `Besoin d'aide pour repondre a un appel d'offres ?\n\n${knowledgeBase.accompagnement.services}\n\nPour prendre RDV : ouvrez la page d'un marche et utilisez le formulaire en bas. Creneaux disponibles du lundi au samedi, 8h-18h.`,
      () => `Notre service d'accompagnement est accessible a tous, gratuits et payants.\n\nPour prendre rendez-vous :\n1. Ouvrez la page d'un marche\n2. En bas, remplissez le formulaire (date + creneau)\n3. On vous recontacte rapidement.\n\nPremier diagnostic gratuit.`,
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
      () => `${knowledgeBase.marchesPublics.repondre}\n\n${knowledgeBase.marchesPublics.delais}`,
      () => `Voici les etapes pour repondre a un appel d'offres :\n\n${knowledgeBase.marchesPublics.repondre}\n\nConseil : utilisez notre page Concurrence pour analyser les prix pratiques.`,
    ],
  },
  {
    name: 'DCE',
    keywords: [
      { word: 'dce', weight: 2 }, { word: 'dossier consultation', weight: 2 }, { word: 'cahier des charges', weight: 2 },
      { word: 'cctp', weight: 2 }, { word: 'reglement', weight: 2 }, { word: 'document', weight: 1 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.dce}\n\nAstuce : le RC (Reglement de Consultation) est le document le plus important. Lisez-le en premier.`,
      () => `Le **DCE** (Dossier de Consultation des Entreprises) est le dossier que vous telechargez pour repondre. Il contient :\n\n- **RC** — Reglement de Consultation (a lire en premier)\n- **CCTP** — Cahier des charges technique\n- **AE** — Acte d'engagement\n- **BPU / DPGF** — Bordereaux de prix\n\nTout se telecharge depuis la plateforme de l'acheteur.`,
    ],
  },
  {
    name: 'SEUILS',
    keywords: [
      { word: 'seuil', weight: 2 }, { word: 'montant', weight: 1 }, { word: 'mapa', weight: 2 },
      { word: 'europeen', weight: 2 }, { word: 'procedure adaptee', weight: 2 }, { word: 'formalisee', weight: 2 },
    ],
    responses: [
      () => `${knowledgeBase.marchesPublics.seuils}\n\nLes MAPA (< 40 000 euros) sont souvent les plus accessibles pour les petites entreprises.`,
      () => `Les seuils determinent la procedure a suivre :\n\n- **< 40 000 euros HT** : procedure libre (MAPA simplifie)\n- **40 000 euros — 221 000 euros** : procedure adaptee (MAPA)\n- **> 221 000 euros** : procedure formalisee (appel d'offres)\n\nPlus le montant est eleve, plus la procedure est encadree.`,
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
      () => `${knowledgeBase.marchesPublics.documentsAdmin}\n\nPreparez ces documents a l'avance pour gagner du temps sur vos reponses.`,
      () => `Les documents administratifs les plus demandes :\n\n- **DC1** — Lettre de candidature\n- **DC2** — Declaration du candidat\n- **Kbis** de moins de 3 mois\n- Attestations fiscales et sociales\n- Attestation d'assurance\n- References de marches similaires\n\nAstuce : gardez un dossier pre-rempli avec tous ces documents a jour.`,
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
      () => `Voici nos meilleurs conseils pour remporter des marches publics :\n\n${pick2or3Conseils()}`,
      () => `Pour maximiser vos chances :\n\n${pick2or3Conseils()}\n\nBesoin d'aide personnalisee ? Prenez un rendez-vous d'accompagnement depuis la page d'un marche.`,
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
      () => `${knowledgeBase.sources.description}\n\n- **BOAMP** : ${knowledgeBase.sources.boamp}\n- **DECP** : ${knowledgeBase.sources.decp}`,
      () => `Nos donnees proviennent de **96 sources officielles** :\n\n- **BOAMP** — Bulletin Officiel des Annonces des Marches Publics (source principale francaise)\n- **TED** — Tenders Electronic Daily (marches europeens)\n- **DECP** — Donnees Essentielles de la Commande Publique (marches attribues)\n- **e-marchespublics.com** — Plus gros profil d\'acheteur prive (5500+ collectivites)\n- Plateformes de dematerialisation regionales`,
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
      () => `Les marches publics se divisent en 3 grandes categories :\n\n- **Travaux** — Construction, renovation, voirie\n- **Fournitures** — Equipements, materiel, mobilier\n- **Services** — Conseil, maintenance, informatique, transport\n\nVous pouvez filtrer par type sur le portail.`,
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
      () => `Un **marche public**, c'est un contrat entre un organisme public et une entreprise privee.\n\n${knowledgeBase.marchesPublics.definition}\n\nC'est une veritable opportunite de business : des milliards d'euros de contrats sont publies chaque annee.`,
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
      () => `Vous pouvez nous contacter a **contact@abdridi.com**.\n\nNotre equipe est disponible du lundi au samedi de 8h a 18h.\n\nVous pouvez aussi prendre rendez-vous directement depuis le portail pour un accompagnement personnalise.`,
      () => `Email : **contact@abdridi.com**\nHoraires : Lundi — Samedi, 8h00 - 18h00\n\nBesoin d'un accompagnement ? Prenez un rendez-vous directement depuis la page d'un marche. Notre equipe vous recontactera rapidement.`,
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
      () => 'Avec plaisir ! N\'hesitez pas si vous avez d\'autres questions. Je suis la pour vous aider.',
      () => 'Ravi d\'avoir pu vous aider. N\'hesitez pas a revenir vers moi si besoin.',
      () => 'Merci a vous ! Si vous avez d\'autres questions sur les marches publics ou le portail, je suis toujours disponible. Bonne continuation.',
    ],
  },
];

const DEFAULT_RESPONSES = [
  () => 'Je comprends votre question mais je n\'ai pas de reponse precise. Voici ce que je peux vous aider sur :\n\n- **Recherche de marches publics** — tapez "consultation"\n- **Abonnements et tarifs** — tapez "abonnement"\n- **Prise de rendez-vous** — tapez "rendez-vous"\n- **Procedures et conseils** — tapez "conseil"\n- **Concurrence** — tapez "concurrence"\n\nOu contactez notre equipe : **contact@abdridi.com**',
  () => 'Je ne suis pas sur de comprendre. Je peux vous renseigner sur :\n\n- Les **consultations** et appels d\'offres\n- Les **abonnements** et tarifs\n- La prise de **rendez-vous**\n- L\'analyse de **concurrence**\n- Des **conseils** pour repondre aux marches\n\nPosez-moi une question plus precise ou ecrivez a **contact@abdridi.com**',
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
