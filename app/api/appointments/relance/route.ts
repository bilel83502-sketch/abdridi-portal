import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST — create a relance for an appointment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const body = await req.json();
    const { appointmentId, note } = body;

    if (!appointmentId || !note?.trim()) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    // Verify the appointment belongs to the user
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, userId: user.id },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous introuvable.' }, { status: 404 });
    }

    const relance = await prisma.relance.create({
      data: {
        appointmentId,
        note: note.trim(),
      },
    });

    return NextResponse.json({ relance }, { status: 201 });
  } catch (e: any) {
    console.error('[Relance POST] ERROR:', e.message);
    return NextResponse.json({ error: e.message || 'Erreur serveur.' }, { status: 500 });
  }
}
