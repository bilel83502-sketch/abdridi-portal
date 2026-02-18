import { PrismaClient, Nature, MarcheType, MarcheStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENDERS = [
  {title:"Rénovation thermique groupe scolaire Jules Ferry",buyer:"Mairie de Lyon",department:"69",nature:Nature.TRAVAUX,type:MarcheType.APPEL_OFFRES,cpvCode:"45321000",cpvLabel:"Travaux d'isolation thermique",estimatedValue:850000,source:"BOAMP",deadline:15,lots:3,duration:"18 mois"},
  {title:"Fourniture de matériel informatique et réseau",buyer:"CHU de Bordeaux",department:"33",nature:Nature.FOURNITURES,type:MarcheType.PROCEDURE_ADAPTEE,cpvCode:"30200000",cpvLabel:"Matériel informatique",estimatedValue:320000,source:"PLACE",deadline:21,lots:2,duration:"12 mois"},
  {title:"Audit cybersécurité et mise en conformité RGPD",buyer:"Métropole Nice Côte d'Azur",department:"06",nature:Nature.SERVICES,type:MarcheType.MARCHE_NEGOCIE,cpvCode:"72810000",cpvLabel:"Services d'audit informatique",estimatedValue:95000,source:"BOAMP",deadline:10,lots:1,duration:"6 mois"},
  {title:"Transport scolaire lignes régulières 2026-2030",buyer:"Région Bretagne",department:"35",nature:Nature.SERVICES,type:MarcheType.APPEL_OFFRES,cpvCode:"60130000",cpvLabel:"Transport routier de passagers",estimatedValue:2100000,source:"TED",deadline:30,lots:8,duration:"48 mois"},
  {title:"Construction gymnase municipal quartier nord",buyer:"Ville de Strasbourg",department:"67",nature:Nature.TRAVAUX,type:MarcheType.APPEL_OFFRES,cpvCode:"45212225",cpvLabel:"Construction installations sportives",estimatedValue:3400000,source:"BOAMP",deadline:25,lots:5,duration:"24 mois"},
  {title:"Fournitures de denrées alimentaires",buyer:"Département du Nord",department:"59",nature:Nature.FOURNITURES,type:MarcheType.PROCEDURE_ADAPTEE,cpvCode:"15800000",cpvLabel:"Produits alimentaires",estimatedValue:450000,source:"PLACE",deadline:18,lots:4,duration:"12 mois"},
  {title:"Nettoyage des bâtiments communaux",buyer:"Commune de Toulouse",department:"31",nature:Nature.SERVICES,type:MarcheType.APPEL_OFFRES,cpvCode:"90910000",cpvLabel:"Services de nettoyage",estimatedValue:180000,source:"e-marchespublics",deadline:12,lots:2,duration:"36 mois"},
  {title:"Aménagement paysager parc central",buyer:"Agglomération de Montpellier",department:"34",nature:Nature.TRAVAUX,type:MarcheType.PROCEDURE_ADAPTEE,cpvCode:"45112710",cpvLabel:"Aménagement espaces verts",estimatedValue:220000,source:"BOAMP",deadline:14,lots:1,duration:"8 mois"},
  {title:"Acquisition de véhicules électriques",buyer:"Ville de Paris",department:"75",nature:Nature.FOURNITURES,type:MarcheType.APPEL_OFFRES,cpvCode:"34144900",cpvLabel:"Véhicules électriques",estimatedValue:5200000,source:"TED",deadline:28,lots:3,duration:"12 mois"},
  {title:"Assistance à maîtrise d'ouvrage",buyer:"Département des Bouches-du-Rhône",department:"13",nature:Nature.SERVICES,type:MarcheType.MARCHE_NEGOCIE,cpvCode:"71310000",cpvLabel:"Conseil en génie",estimatedValue:150000,source:"BOAMP",deadline:16,lots:1,duration:"24 mois"},
  {title:"Fourniture et pose de mobilier scolaire",buyer:"Région Île-de-France",department:"75",nature:Nature.FOURNITURES,type:MarcheType.APPEL_OFFRES,cpvCode:"39160000",cpvLabel:"Mobilier scolaire",estimatedValue:780000,source:"PLACE",deadline:20,lots:6,duration:"12 mois"},
  {title:"Réfection des voiries communales Phase 2",buyer:"Commune de Nantes",department:"44",nature:Nature.TRAVAUX,type:MarcheType.APPEL_OFFRES,cpvCode:"45233120",cpvLabel:"Construction de routes",estimatedValue:1200000,source:"BOAMP",deadline:22,lots:4,duration:"14 mois"},
];

async function main() {
  console.log('Seeding...');
  const adminHash = await bcrypt.hash('admin2026', 12);
  await prisma.user.upsert({where:{email:'admin@abdridi.com'},update:{},create:{email:'admin@abdridi.com',name:'Admin AB DRIDI',company:'AB DRIDI',phone:'0749845661',passwordHash:adminHash,role:'ADMIN',plan:'STRATEGIE'}});
  const demoHash = await bcrypt.hash('demo2026', 12);
  const demo = await prisma.user.upsert({where:{email:'demo@abdridi.com'},update:{},create:{email:'demo@abdridi.com',name:'Utilisateur Démo',company:'Entreprise Démo SAS',passwordHash:demoHash,role:'USER',plan:'VEILLE'}});

  const now = new Date();
  for (const t of TENDERS) {
    const pub = new Date(now); pub.setDate(pub.getDate() - Math.floor(Math.random()*14));
    const dl = new Date(now); dl.setDate(dl.getDate() + t.deadline);
    await prisma.marche.create({data:{
      reference:`${t.source.substring(0,3).toUpperCase()}-${now.getFullYear()}-${Math.floor(Math.random()*90000)+10000}`,
      title:t.title,description:`Marché public - ${t.title}`,buyer:t.buyer,department:t.department,
      nature:t.nature,type:t.type,cpvCode:t.cpvCode,cpvLabel:t.cpvLabel,estimatedValue:t.estimatedValue,
      deadline:dl,publicationDate:pub,source:t.source,
      sourceUrl:`https://www.boamp.fr/avis/${Math.floor(Math.random()*9000000)+1000000}`,
      status:MarcheStatus.OUVERT,lots:t.lots,duration:t.duration,
    }});
  }

  await prisma.alert.create({data:{userId:demo.id,name:'Travaux Rhône-Alpes',active:true,frequency:'QUOTIDIEN',
    keywords:['rénovation','construction'],departments:['69','38'],natures:[Nature.TRAVAUX],cpvCodes:[],sources:[]}});

  console.log('Done! Admin: admin@abdridi.com/admin2026 | Demo: demo@abdridi.com/demo2026');
}

main().catch(e=>{console.error(e);process.exit(1);}).finally(async()=>{await prisma.$disconnect();});
