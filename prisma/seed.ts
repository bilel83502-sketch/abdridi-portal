import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Delete ALL existing users and their alerts
  await prisma.alert.deleteMany({});
  await prisma.user.deleteMany({});

  // Create single admin account
  const adminHash = await bcrypt.hash('Bilel2004', 12);
  await prisma.user.create({
    data: {
      email: 'bilel83502@gmail.com',
      name: 'Bilel Dridi',
      company: 'AB DRIDI',
      passwordHash: adminHash,
      role: 'ADMIN',
      plan: 'MONTAGE',
      sector: 'Conseil',
    },
  });

  // Marchés (upsert to avoid duplicates)
  const marches = [
    { title: "Rénovation thermique du groupe scolaire Jules Ferry — Lots TCE", buyer: "Mairie de Lyon", nature: "TRAVAUX", department: "69", departmentName: "Rhône", region: "Auvergne-Rhône-Alpes", value: 850000, deadline: d(15), publicationDate: d(-7), source: "BOAMP", sourceRef: "BOAMP-2026-034521", procedureType: "Appel d'offres ouvert", cpvCode: "45321000", cpvLabel: "Isolation thermique", lots: 3, duration: "18 mois" },
    { title: "Fourniture de matériel informatique et équipements réseau", buyer: "CHU de Bordeaux", nature: "FOURNITURES", department: "33", departmentName: "Gironde", region: "Nouvelle-Aquitaine", value: 320000, deadline: d(21), publicationDate: d(-9), source: "PLACE", sourceRef: "PLACE-2026-078432", procedureType: "Procédure adaptée", cpvCode: "30200000", cpvLabel: "Matériel informatique", lots: 2, duration: "12 mois" },
    { title: "Audit cybersécurité des infrastructures et mise en conformité RGPD", buyer: "Métropole Nice Côte d'Azur", nature: "SERVICES", department: "06", departmentName: "Alpes-Maritimes", region: "PACA", value: 95000, deadline: d(5), publicationDate: d(-5), source: "BOAMP", sourceRef: "BOAMP-2026-012098", procedureType: "Marché négocié", cpvCode: "72810000", cpvLabel: "Audit informatique", lots: 1, duration: "6 mois" },
    { title: "Transport scolaire — Lignes régulières 2026-2030", buyer: "Conseil Régional de Bretagne", nature: "SERVICES", department: "35", departmentName: "Ille-et-Vilaine", region: "Bretagne", value: 2100000, deadline: d(30), publicationDate: d(-11), source: "TED", sourceRef: "TED-2026-055012", procedureType: "Appel d'offres ouvert", cpvCode: "60130000", cpvLabel: "Transport de passagers", lots: 8, duration: "48 mois" },
    { title: "Construction d'un gymnase municipal — Quartier Nord", buyer: "Eurométropole de Strasbourg", nature: "TRAVAUX", department: "67", departmentName: "Bas-Rhin", region: "Grand Est", value: 3400000, deadline: d(25), publicationDate: d(-10), source: "BOAMP", sourceRef: "BOAMP-2026-041233", procedureType: "Appel d'offres ouvert", cpvCode: "45212225", cpvLabel: "Construction sportive", lots: 5, duration: "24 mois" },
    { title: "Fourniture de repas en liaison froide pour restauration scolaire", buyer: "Ville de Toulouse", nature: "FOURNITURES", department: "31", departmentName: "Haute-Garonne", region: "Occitanie", value: 480000, deadline: d(18), publicationDate: d(-6), source: "PLACE", sourceRef: "PLACE-2026-067890", procedureType: "Procédure adaptée", cpvCode: "15894000", cpvLabel: "Produits alimentaires", lots: 4, duration: "12 mois" },
    { title: "Entretien des espaces verts et aires de jeux communales", buyer: "Mairie de Nantes", nature: "SERVICES", department: "44", departmentName: "Loire-Atlantique", region: "Pays de la Loire", value: 220000, deadline: d(12), publicationDate: d(-8), source: "BOAMP", sourceRef: "BOAMP-2026-023456", procedureType: "Procédure adaptée", cpvCode: "77310000", cpvLabel: "Espaces verts", lots: 2, duration: "36 mois" },
    { title: "Marché de maîtrise d'œuvre pour restructuration du centre aquatique", buyer: "Communauté d'agglomération de Montpellier", nature: "SERVICES", department: "34", departmentName: "Hérault", region: "Occitanie", value: 680000, deadline: d(35), publicationDate: d(-3), source: "BOAMP", sourceRef: "BOAMP-2026-045678", procedureType: "Concours", cpvCode: "71221000", cpvLabel: "Architecture", lots: 1, duration: "6 mois" },
    { title: "Fourniture de véhicules électriques pour flotte municipale", buyer: "Ville de Paris", nature: "FOURNITURES", department: "75", departmentName: "Paris", region: "Île-de-France", value: 1200000, deadline: d(22), publicationDate: d(-4), source: "PLACE", sourceRef: "PLACE-2026-034567", procedureType: "Appel d'offres ouvert", cpvCode: "34144900", cpvLabel: "Véhicules électriques", lots: 3, duration: "24 mois" },
    { title: "Réhabilitation de la toiture du musée départemental", buyer: "Conseil Départemental du Var", nature: "TRAVAUX", department: "83", departmentName: "Var", region: "PACA", value: 560000, deadline: d(20), publicationDate: d(-12), source: "BOAMP", sourceRef: "BOAMP-2026-056789", procedureType: "Appel d'offres ouvert", cpvCode: "45261000", cpvLabel: "Travaux de toiture", lots: 2, duration: "12 mois" },
    { title: "Prestation de nettoyage des locaux administratifs", buyer: "Préfecture de Lille", nature: "SERVICES", department: "59", departmentName: "Nord", region: "Hauts-de-France", value: 180000, deadline: d(10), publicationDate: d(-14), source: "PLACE", sourceRef: "PLACE-2026-012345", procedureType: "Procédure adaptée", cpvCode: "90910000", cpvLabel: "Nettoyage", lots: 1, duration: "36 mois" },
    { title: "Construction d'une crèche multi-accueil de 40 berceaux", buyer: "Mairie de Rennes", nature: "TRAVAUX", department: "35", departmentName: "Ille-et-Vilaine", region: "Bretagne", value: 1900000, deadline: d(28), publicationDate: d(-2), source: "BOAMP", sourceRef: "BOAMP-2026-067891", procedureType: "Appel d'offres ouvert", cpvCode: "45214100", cpvLabel: "Bâtiment petite enfance", lots: 6, duration: "18 mois" },
    { title: "Mission de contrôle technique pour opérations de construction", buyer: "Métropole Aix-Marseille-Provence", nature: "SERVICES", department: "13", departmentName: "Bouches-du-Rhône", region: "PACA", value: 150000, deadline: d(16), publicationDate: d(-6), source: "BOAMP", sourceRef: "BOAMP-2026-078902", procedureType: "Procédure adaptée", cpvCode: "71631000", cpvLabel: "Contrôle technique", lots: 1, duration: "48 mois" },
    { title: "Fourniture de mobilier scolaire pour écoles primaires", buyer: "Ville de Grenoble", nature: "FOURNITURES", department: "38", departmentName: "Isère", region: "Auvergne-Rhône-Alpes", value: 290000, deadline: d(19), publicationDate: d(-7), source: "PLACE", sourceRef: "PLACE-2026-089013", procedureType: "Procédure adaptée", cpvCode: "39160000", cpvLabel: "Mobilier scolaire", lots: 3, duration: "12 mois" },
    { title: "Travaux de voirie et réseaux divers — ZAC des Berges", buyer: "Eurométropole de Strasbourg", nature: "TRAVAUX", department: "67", departmentName: "Bas-Rhin", region: "Grand Est", value: 4200000, deadline: d(32), publicationDate: d(-1), source: "BOAMP", sourceRef: "BOAMP-2026-090124", procedureType: "Appel d'offres ouvert", cpvCode: "45233000", cpvLabel: "Voirie", lots: 4, duration: "30 mois" },
    { title: "Gestion et exploitation du réseau de chaleur urbain", buyer: "Métropole du Grand Nancy", nature: "SERVICES", department: "54", departmentName: "Meurthe-et-Moselle", region: "Grand Est", value: 8500000, deadline: d(45), publicationDate: d(-3), source: "TED", sourceRef: "TED-2026-101235", procedureType: "Concession de service", cpvCode: "09323000", cpvLabel: "Chauffage urbain", lots: 1, duration: "240 mois" },
    { title: "Fourniture de produits d'entretien et d'hygiène", buyer: "CHU de Nantes", nature: "FOURNITURES", department: "44", departmentName: "Loire-Atlantique", region: "Pays de la Loire", value: 75000, deadline: d(8), publicationDate: d(-15), source: "PLACE", sourceRef: "PLACE-2026-112346", procedureType: "Procédure adaptée", cpvCode: "39830000", cpvLabel: "Produits d'entretien", lots: 5, duration: "24 mois" },
    { title: "Réfection de la chaussée — RD 1075 entre PR 12 et PR 18", buyer: "Conseil Départemental de l'Isère", nature: "TRAVAUX", department: "38", departmentName: "Isère", region: "Auvergne-Rhône-Alpes", value: 720000, deadline: d(14), publicationDate: d(-9), source: "BOAMP", sourceRef: "BOAMP-2026-123457", procedureType: "Appel d'offres ouvert", cpvCode: "45233222", cpvLabel: "Revêtement routier", lots: 2, duration: "6 mois" },
    { title: "Prestations d'assurance pour la collectivité", buyer: "Communauté Urbaine de Dunkerque", nature: "SERVICES", department: "59", departmentName: "Nord", region: "Hauts-de-France", value: 340000, deadline: d(26), publicationDate: d(-5), source: "BOAMP", sourceRef: "BOAMP-2026-134568", procedureType: "Appel d'offres ouvert", cpvCode: "66510000", cpvLabel: "Assurance", lots: 6, duration: "48 mois" },
    { title: "Fourniture et pose de menuiseries aluminium — Lycée Voltaire", buyer: "Région Île-de-France", nature: "TRAVAUX", department: "75", departmentName: "Paris", region: "Île-de-France", value: 430000, deadline: d(17), publicationDate: d(-8), source: "PLACE", sourceRef: "PLACE-2026-145679", procedureType: "Appel d'offres ouvert", cpvCode: "45421100", cpvLabel: "Menuiseries", lots: 1, duration: "8 mois" },
    { title: "Étude de faisabilité pour réseau de transport en commun", buyer: "Syndicat Mixte des Transports de Toulouse", nature: "SERVICES", department: "31", departmentName: "Haute-Garonne", region: "Occitanie", value: 280000, deadline: d(23), publicationDate: d(-4), source: "BOAMP", sourceRef: "BOAMP-2026-156780", procedureType: "Procédure adaptée", cpvCode: "71311000", cpvLabel: "Études de transport", lots: 1, duration: "12 mois" },
    { title: "Fourniture de matériel médical — Imagerie et radiologie", buyer: "AP-HP", nature: "FOURNITURES", department: "75", departmentName: "Paris", region: "Île-de-France", value: 5600000, deadline: d(40), publicationDate: d(-2), source: "TED", sourceRef: "TED-2026-167891", procedureType: "Appel d'offres ouvert", cpvCode: "33111000", cpvLabel: "Matériel de radiologie", lots: 3, duration: "48 mois" },
    { title: "Aménagement paysager du parc urbain — Écoquartier Confluence", buyer: "Métropole de Lyon", nature: "TRAVAUX", department: "69", departmentName: "Rhône", region: "Auvergne-Rhône-Alpes", value: 1100000, deadline: d(27), publicationDate: d(-6), source: "BOAMP", sourceRef: "BOAMP-2026-178902", procedureType: "Appel d'offres ouvert", cpvCode: "45112711", cpvLabel: "Aménagement paysager", lots: 2, duration: "14 mois" },
    { title: "Maintenance des systèmes de climatisation et ventilation", buyer: "Université de Bordeaux", nature: "SERVICES", department: "33", departmentName: "Gironde", region: "Nouvelle-Aquitaine", value: 195000, deadline: d(11), publicationDate: d(-10), source: "PLACE", sourceRef: "PLACE-2026-189013", procedureType: "Procédure adaptée", cpvCode: "50730000", cpvLabel: "Maintenance CVC", lots: 1, duration: "36 mois" },
  ];

  for (const m of marches) {
    await prisma.marche.upsert({
      where: { sourceRef: m.sourceRef },
      update: {},
      create: { ...m, status: 'OUVERT' },
    });
  }

  console.log('✅ Seed terminé : 1 admin (bilel83502@gmail.com), 24 marchés');
}

function d(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

main().catch(console.error).finally(() => prisma.$disconnect());
