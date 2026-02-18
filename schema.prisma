import { PrismaClient, Nature, MarcheType, MarcheStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENDERS = [
  { title: "Rénovation thermique groupe scolaire Jules Ferry", buyer: "Mairie de Lyon", department: "69", nature: Nature.TRAVAUX, type: MarcheType.APPEL_OFFRES, cpvCode: "45321000", cpvLabel: "Travaux d'isolation thermique", estimatedValue: 850000, source: "BOAMP", deadline: 15, lots: 3, duration: "18 mois" },
  { title: "Fourniture de matériel informatique et réseau", buyer: "CHU de Bordeaux", department: "33", nature: Nature.FOURNITURES, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "30200000", cpvLabel: "Matériel et fournitures informatiques", estimatedValue: 320000, source: "PLACE", deadline: 21, lots: 2, duration: "12 mois" },
  { title: "Audit cybersécurité et mise en conformité RGPD", buyer: "Métropole Nice Côte d'Azur", department: "06", nature: Nature.SERVICES, type: MarcheType.MARCHE_NEGOCIE, cpvCode: "72810000", cpvLabel: "Services d'audit informatique", estimatedValue: 95000, source: "BOAMP", deadline: 10, lots: 1, duration: "6 mois" },
  { title: "Transport scolaire lignes régulières 2026-2030", buyer: "Région Bretagne", department: "35", nature: Nature.SERVICES, type: MarcheType.APPEL_OFFRES, cpvCode: "60130000", cpvLabel: "Services de transport routier de passagers", estimatedValue: 2100000, source: "TED", deadline: 30, lots: 8, duration: "48 mois" },
  { title: "Construction gymnase municipal quartier nord", buyer: "Ville de Strasbourg", department: "67", nature: Nature.TRAVAUX, type: MarcheType.APPEL_OFFRES, cpvCode: "45212225", cpvLabel: "Travaux de construction d'installations sportives", estimatedValue: 3400000, source: "BOAMP", deadline: 25, lots: 5, duration: "24 mois" },
  { title: "Marché de fournitures de denrées alimentaires", buyer: "Département du Nord", department: "59", nature: Nature.FOURNITURES, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "15800000", cpvLabel: "Produits alimentaires divers", estimatedValue: 450000, source: "PLACE", deadline: 18, lots: 4, duration: "12 mois" },
  { title: "Prestations de nettoyage des bâtiments communaux", buyer: "Commune de Toulouse", department: "31", nature: Nature.SERVICES, type: MarcheType.APPEL_OFFRES, cpvCode: "90910000", cpvLabel: "Services de nettoyage", estimatedValue: 180000, source: "e-marchespublics", deadline: 12, lots: 2, duration: "36 mois" },
  { title: "Aménagement paysager parc central", buyer: "Communauté d'agglomération de Montpellier", department: "34", nature: Nature.TRAVAUX, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "45112710", cpvLabel: "Travaux d'aménagement paysager d'espaces verts", estimatedValue: 220000, source: "BOAMP", deadline: 14, lots: 1, duration: "8 mois" },
  { title: "Acquisition de véhicules électriques", buyer: "Ville de Paris", department: "75", nature: Nature.FOURNITURES, type: MarcheType.APPEL_OFFRES, cpvCode: "34144900", cpvLabel: "Véhicules électriques", estimatedValue: 5200000, source: "TED", deadline: 28, lots: 3, duration: "12 mois" },
  { title: "Mission d'assistance à maîtrise d'ouvrage", buyer: "Département des Bouches-du-Rhône", department: "13", nature: Nature.SERVICES, type: MarcheType.MARCHE_NEGOCIE, cpvCode: "71310000", cpvLabel: "Services de conseil en matière de génie", estimatedValue: 150000, source: "BOAMP", deadline: 16, lots: 1, duration: "24 mois" },
  { title: "Fourniture et pose de mobilier scolaire", buyer: "Région Île-de-France", department: "75", nature: Nature.FOURNITURES, type: MarcheType.APPEL_OFFRES, cpvCode: "39160000", cpvLabel: "Mobilier scolaire", estimatedValue: 780000, source: "PLACE", deadline: 20, lots: 6, duration: "12 mois" },
  { title: "Réfection des voiries communales - Phase 2", buyer: "Commune de Nantes", department: "44", nature: Nature.TRAVAUX, type: MarcheType.APPEL_OFFRES, cpvCode: "45233120", cpvLabel: "Travaux de construction de routes", estimatedValue: 1200000, source: "BOAMP", deadline: 22, lots: 4, duration: "14 mois" },
  { title: "Prestations d'études géotechniques", buyer: "SNCF Réseau", department: "93", nature: Nature.SERVICES, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "71351500", cpvLabel: "Services d'investigation géotechnique", estimatedValue: 85000, source: "PLACE", deadline: 11, lots: 1, duration: "6 mois" },
  { title: "Maintenance des installations de chauffage", buyer: "Office HLM de Lille", department: "59", nature: Nature.SERVICES, type: MarcheType.APPEL_OFFRES, cpvCode: "50720000", cpvLabel: "Services de réparation et d'entretien de chauffage central", estimatedValue: 340000, source: "BOAMP", deadline: 19, lots: 2, duration: "48 mois" },
  { title: "Conception et impression de supports de communication", buyer: "Communauté urbaine de Dunkerque", department: "59", nature: Nature.SERVICES, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "79810000", cpvLabel: "Services d'impression", estimatedValue: 45000, source: "achatpublic.com", deadline: 8, lots: 1, duration: "12 mois" },
  { title: "Travaux de mise en accessibilité PMR", buyer: "Département du Rhône", department: "69", nature: Nature.TRAVAUX, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "45000000", cpvLabel: "Travaux de construction", estimatedValue: 560000, source: "Maximilien", deadline: 17, lots: 3, duration: "10 mois" },
  { title: "Fourniture de dispositifs médicaux", buyer: "AP-HP", department: "75", nature: Nature.FOURNITURES, type: MarcheType.APPEL_OFFRES, cpvCode: "33100000", cpvLabel: "Équipements médicaux", estimatedValue: 1800000, source: "RESAH", deadline: 24, lots: 10, duration: "24 mois" },
  { title: "Prestations de gardiennage et sûreté", buyer: "Aéroport de Marseille Provence", department: "13", nature: Nature.SERVICES, type: MarcheType.APPEL_OFFRES, cpvCode: "79710000", cpvLabel: "Services de sécurité", estimatedValue: 920000, source: "BOAMP", deadline: 26, lots: 2, duration: "36 mois" },
  { title: "Réhabilitation de la piscine municipale", buyer: "Ville de Rennes", department: "35", nature: Nature.TRAVAUX, type: MarcheType.APPEL_OFFRES, cpvCode: "45212212", cpvLabel: "Travaux de construction de piscines", estimatedValue: 4500000, source: "Mégalis Bretagne", deadline: 32, lots: 7, duration: "20 mois" },
  { title: "Fourniture d'énergie électrique", buyer: "Syndicat intercommunal des Alpes", department: "38", nature: Nature.FOURNITURES, type: MarcheType.APPEL_OFFRES, cpvCode: "09310000", cpvLabel: "Électricité", estimatedValue: 680000, source: "UGAP", deadline: 20, lots: 1, duration: "36 mois" },
  { title: "Maîtrise d'œuvre extension collège Victor Hugo", buyer: "Département de Loire-Atlantique", department: "44", nature: Nature.SERVICES, type: MarcheType.APPEL_OFFRES, cpvCode: "71200000", cpvLabel: "Services d'architecture", estimatedValue: 280000, source: "PLACE", deadline: 23, lots: 1, duration: "36 mois" },
  { title: "Fourniture de vêtements de travail et EPI", buyer: "Ville de Marseille", department: "13", nature: Nature.FOURNITURES, type: MarcheType.PROCEDURE_ADAPTEE, cpvCode: "18100000", cpvLabel: "Vêtements professionnels", estimatedValue: 120000, source: "BOAMP", deadline: 13, lots: 3, duration: "24 mois" },
  { title: "Entretien des espaces verts communaux", buyer: "Commune de Bordeaux", department: "33", nature: Nature.SERVICES, type: MarcheType.APPEL_OFFRES, cpvCode: "77310000", cpvLabel: "Services de plantation et d'entretien de zones vertes", estimatedValue: 390000, source: "achatpublic.com", deadline: 15, lots: 4, duration: "48 mois" },
  { title: "Construction d'un centre culturel multimédia", buyer: "Métropole européenne de Lille", department: "59", nature: Nature.TRAVAUX, type: MarcheType.DIALOGUE_COMPETITIF, cpvCode: "45210000", cpvLabel: "Travaux de construction de bâtiments", estimatedValue: 8200000, source: "TED", deadline: 35, lots: 9, duration: "30 mois" },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('admin2026', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@abdridi.com' },
    update: {},
    create: {
      email: 'admin@abdridi.com',
      name: 'Admin AB DRIDI',
      company: 'AB DRIDI',
      phone: '0749845661',
      passwordHash: adminHash,
      role: 'ADMIN',
      plan: 'STRATEGIE',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Demo user
  const demoHash = await bcrypt.hash('demo2026', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@abdridi.com' },
    update: {},
    create: {
      email: 'demo@abdridi.com',
      name: 'Utilisateur Démo',
      company: 'Entreprise Démo SAS',
      phone: '0600000000',
      passwordHash: demoHash,
      role: 'USER',
      plan: 'VEILLE',
    },
  });
  console.log(`✅ Demo: ${demo.email}`);

  // Seed tenders
  const now = new Date();
  for (const t of TENDERS) {
    const pubDate = new Date(now);
    pubDate.setDate(pubDate.getDate() - Math.floor(Math.random() * 14));
    
    const deadlineDate = new Date(now);
    deadlineDate.setDate(deadlineDate.getDate() + t.deadline);

    await prisma.marche.create({
      data: {
        reference: `${t.source.substring(0, 3).toUpperCase()}-${now.getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`,
        title: t.title,
        description: `Marché public - ${t.title}. Acheteur : ${t.buyer}. Ce marché porte sur ${t.title.toLowerCase()} pour le compte de ${t.buyer}.`,
        buyer: t.buyer,
        department: t.department,
        region: getRegion(t.department),
        nature: t.nature,
        type: t.type,
        cpvCode: t.cpvCode,
        cpvLabel: t.cpvLabel,
        estimatedValue: t.estimatedValue,
        deadline: deadlineDate,
        publicationDate: pubDate,
        source: t.source,
        sourceUrl: `https://www.boamp.fr/avis/${Math.floor(Math.random() * 9000000) + 1000000}`,
        status: MarcheStatus.OUVERT,
        lots: t.lots,
        duration: t.duration,
      },
    });
  }
  console.log(`✅ ${TENDERS.length} marchés créés`);

  // Sample alert for demo user
  await prisma.alert.create({
    data: {
      userId: demo.id,
      name: 'Travaux Rhône-Alpes',
      active: true,
      frequency: 'QUOTIDIEN',
      keywords: ['rénovation', 'construction', 'bâtiment'],
      departments: ['69', '38', '01', '73', '74'],
      natures: [Nature.TRAVAUX],
      cpvCodes: [],
      sources: [],
    },
  });
  console.log('✅ Alerte démo créée');

  console.log('\n🎉 Seed terminé !');
  console.log('   Admin : admin@abdridi.com / admin2026');
  console.log('   Démo  : demo@abdridi.com / demo2026');
}

function getRegion(dept: string): string {
  const map: Record<string, string> = {
    '06': 'PACA', '13': 'PACA', '31': 'Occitanie', '33': 'Nouvelle-Aquitaine',
    '34': 'Occitanie', '35': 'Bretagne', '38': 'Auvergne-Rhône-Alpes',
    '44': 'Pays de la Loire', '59': 'Hauts-de-France', '67': 'Grand Est',
    '69': 'Auvergne-Rhône-Alpes', '75': 'Île-de-France', '93': 'Île-de-France',
  };
  return map[dept] || 'France';
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
