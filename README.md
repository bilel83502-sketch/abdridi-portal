# AB DRIDI — Portail Marchés Publics

Portail client de veille et gestion des appels d'offres publics.  
93 sources agrégées · Mises à jour 3×/jour · Filtres avancés · Alertes email

## 🛠 Stack technique

- **Framework** : Next.js 14 (App Router)
- **Base de données** : PostgreSQL via Prisma ORM
- **Auth** : NextAuth.js (credentials)
- **Styling** : Tailwind CSS (dark theme AB DRIDI)
- **Emails** : Resend (alertes)
- **Hébergement** : Vercel

## 🚀 Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → Remplir DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Créer la base de données
npx prisma db push

# 4. Peupler avec des données de démo
npm run db:seed

# 5. Lancer le serveur de dev
npm run dev
```

→ Ouvrir http://localhost:3000

### Comptes de démo
| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@abdridi.com | admin2026 | Admin |
| demo@abdridi.com | demo2026 | User |

## 📦 Déploiement sur Vercel

### 1. Base de données PostgreSQL
Créer une base gratuite sur [Neon](https://neon.tech) ou [Supabase](https://supabase.com).
Copier l'URL de connexion.

### 2. Déployer sur Vercel
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ou connecter le repo GitHub à Vercel pour le déploiement automatique
```

### 3. Variables d'environnement (Vercel Dashboard)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://portail.abdridi.com
RESEND_API_KEY=re_xxxxxxxxxxxx (optionnel)
```

### 4. Domaine personnalisé
Dans Vercel → Settings → Domains → Ajouter `portail.abdridi.com`
Configurer le CNAME chez votre registrar.

### 5. Initialiser la base
```bash
npx prisma db push
npm run db:seed
```

## 📁 Structure

```
app/
├── auth/            # Pages login / register
│   ├── login/
│   └── register/
├── (app)/           # Pages protégées (avec sidebar)
│   ├── dashboard/   # Tableau de bord + stats
│   ├── marches/     # Recherche marchés + filtres
│   ├── alertes/     # Gestion des alertes email
│   └── parametres/  # Profil + abonnement
├── api/
│   ├── auth/        # NextAuth
│   ├── register/    # Inscription
│   ├── marches/     # API recherche marchés
│   ├── alertes/     # CRUD alertes
│   └── dashboard/   # Stats agrégées
components/
├── Sidebar.tsx      # Navigation latérale
lib/
├── prisma.ts        # Client Prisma
├── auth.ts          # Config NextAuth
└── utils.ts         # Helpers (format, couleurs, départements)
prisma/
├── schema.prisma    # Modèle de données
└── seed.ts          # Données de démo
```

## 🔮 Prochaines étapes

- [ ] Connecteurs pour importer les marchés en temps réel (BOAMP API, scraping PLACE/TED)
- [ ] Envoi d'emails via Resend (cron job Vercel)
- [ ] Système de favoris fonctionnel
- [ ] Export PDF/Excel des résultats
- [ ] Tableau de bord admin pour gérer les utilisateurs
- [ ] Intégration Stripe pour les abonnements
- [ ] Recherche full-text avec pg_trgm ou Typesense

## 📞 Contact

AB DRIDI — Stratégie & Performance  
📧 contact@abdridi.com  
📱 07 49 84 56 61  
🌐 https://abdridi.com
