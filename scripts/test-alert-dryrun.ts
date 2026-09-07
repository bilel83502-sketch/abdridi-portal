/**
 * Dry-run: simulate alert matching for a user
 * Usage: npx tsx scripts/test-alert-dryrun.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

function loadEnv() {
  const envLocal = resolve(process.cwd(), '.env.local');
  try {
    const lines = readFileSync(envLocal, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="([^"]*)"/) ||
                line.match(/^([A-Z_][A-Z0-9_]*)='([^']*)'/) ||
                line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {}
}

async function main() {
  loadEnv();
  const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

  try {
    // 1. Find user
    const user = await prisma.user.findFirst({
      where: { name: { contains: 'Bilel', mode: 'insensitive' } },
    });
    if (!user) {
      console.log('User Bilel not found');
      return;
    }
    console.log(`\n👤 User: ${user.name} — ${user.email}\n`);

    // 2. Create test alert if none exists
    const existingAlerts = await prisma.alert.findMany({ where: { userId: user.id } });
    if (existingAlerts.length === 0) {
      console.log('   Aucune alerte — création de l\'alerte test...');
      await prisma.alert.create({
        data: {
          name: 'test',
          keywords: ['transport', 'déchet'],
          natures: [],
          departments: [],
          frequency: 'DAILY',
          active: true,
          userId: user.id,
        },
      });
      console.log('   ✅ Alerte "test" créée (keywords: transport, déchet)\n');
    }

    // Find alerts
    const alerts = await prisma.alert.findMany({ where: { userId: user.id } });
    console.log(`📋 ${alerts.length} alerte(s) trouvée(s):`);
    for (const a of alerts) {
      console.log(`   - "${a.name}" | active: ${a.active} | keywords: [${a.keywords.join(', ')}] | natures: [${a.natures.join(', ')}] | departments: [${a.departments.join(', ')}]`);
    }

    // 3. Simulate match for each active alert
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    for (const alert of alerts.filter((a) => a.active)) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🔔 Simulation alerte: "${alert.name}"`);
      console.log(`   Keywords: [${alert.keywords.join(', ')}]`);

      const where: any = {
        status: 'OUVERT',
        publicationDate: { gte: yesterday },
      };

      if (alert.keywords.length > 0) {
        where.OR = alert.keywords.map((kw) => ({
          OR: [
            { title: { contains: kw, mode: 'insensitive' } },
            { buyer: { contains: kw, mode: 'insensitive' } },
            { cpvLabel: { contains: kw, mode: 'insensitive' } },
          ],
        }));
      }

      if (alert.natures.length > 0) {
        where.nature = { in: alert.natures };
      }

      if (alert.departments.length > 0) {
        where.department = { in: alert.departments };
      }

      // Match with date filter (what would be sent today)
      const marches = await prisma.marche.findMany({
        where,
        orderBy: { publicationDate: 'desc' },
        take: 20,
      });

      console.log(`\n   📊 Marchés matchés (dernières 24h) : ${marches.length}`);

      if (marches.length > 0) {
        for (const m of marches.slice(0, 5)) {
          console.log(`      → ${m.title?.slice(0, 80)}`);
          console.log(`        Émetteur: ${m.buyer?.slice(0, 50)} | Source: ${m.source} | Deadline: ${m.deadline ? m.deadline.toISOString().slice(0, 10) : '—'}`);
        }
        if (marches.length > 5) {
          console.log(`      ... + ${marches.length - 5} marchés supplémentaires`);
        }
        console.log(`\n   ✅ EMAIL SERAIT ENVOYÉ à ${user.email}`);
        console.log(`      Sujet: "${marches.length} nouveau${marches.length > 1 ? 'x' : ''} marché${marches.length > 1 ? 's' : ''} correspond${marches.length > 1 ? 'ent' : ''} à votre alerte — AB DRIDI"`);
      } else {
        // Check without date filter
        const whereAllTime = { ...where };
        delete whereAllTime.publicationDate;
        const allTimeCount = await prisma.marche.count({ where: whereAllTime });
        console.log(`   📊 Marchés matchés (tout temps, sans filtre date) : ${allTimeCount}`);
        console.log(`\n   ⏭  PAS D'EMAIL (0 nouveaux marchés dans les dernières 24h)`);
      }
    }

    // 4. Global stats
    console.log(`\n${'═'.repeat(60)}`);
    const totalMarches = await prisma.marche.count();
    const openMarches = await prisma.marche.count({ where: { status: 'OUVERT' } });
    const recentMarches = await prisma.marche.count({ where: { publicationDate: { gte: yesterday } } });
    console.log(`📊 Stats globales :`);
    console.log(`   Total marchés : ${totalMarches}`);
    console.log(`   Marchés ouverts : ${openMarches}`);
    console.log(`   Publiés dernières 24h : ${recentMarches}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
