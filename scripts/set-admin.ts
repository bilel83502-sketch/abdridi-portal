/**
 * Set a user's role to ADMIN.
 * Usage: npx tsx scripts/set-admin.ts bilel83502@gmail.com
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/set-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, plan: true, stripeCustomerId: true, stripeCurrentPeriodEnd: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    // List all users for reference
    const users = await prisma.user.findMany({ select: { email: true, role: true, plan: true }, take: 20 });
    console.log('\nExisting users:');
    users.forEach(u => console.log(`  ${u.email} — role: ${u.role}, plan: ${u.plan}`));
    process.exit(1);
  }

  console.log('Current state:');
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Role: ${user.role}`);
  console.log(`  Plan: ${user.plan}`);
  console.log(`  Stripe Customer: ${user.stripeCustomerId || 'none'}`);
  console.log(`  Stripe Period End: ${user.stripeCurrentPeriodEnd || 'none'}`);

  if (user.role === 'ADMIN') {
    console.log('\n✅ User is already ADMIN. No changes needed.');
    process.exit(0);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`\n✅ Role updated: ${user.role} → ADMIN`);
  console.log(`  User ${updated.email} is now ADMIN with full access.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
