import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSecret } from '@/lib/two-factor';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  if (dbUser.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA déjà activé' }, { status: 400 });
  }

  // Generate secret and QR code
  const { secret, otpauthUrl } = generateSecret(dbUser.email);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Store secret temporarily (not yet enabled)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({ qrCode: qrCodeDataUrl, secret });
}
