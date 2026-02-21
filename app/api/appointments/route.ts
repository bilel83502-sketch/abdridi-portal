import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET — list appointments for current user (or all if admin)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all');

    // Admin can fetch all appointments
    if (all === 'true' && user.role === 'ADMIN') {
      const appointments = await prisma.appointment.findMany({
        include: {
          user: {
            select: { name: true, email: true, company: true },
          },
        },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ appointments });
    }

    // Regular user: only their own appointments
    // Check plan access
    if (user.role !== 'ADMIN' && user.plan !== 'VEILLE') {
      return NextResponse.json({ error: 'Acc\u00e8s r\u00e9serv\u00e9 aux abonn\u00e9s.' }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ appointments });
  } catch (e: any) {
    console.error('Appointments GET error:', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

// POST — create a new appointment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Check plan access (VEILLE or ADMIN only)
    if (user.role !== 'ADMIN' && user.plan !== 'VEILLE') {
      return NextResponse.json({ error: 'Acc\u00e8s r\u00e9serv\u00e9 aux abonn\u00e9s Veille & Accompagnement.' }, { status: 403 });
    }

    const body = await req.json();
    const { subject, reference, date, timeSlot, message } = body;

    if (!subject || !date || !timeSlot) {
      return NextResponse.json({ error: 'Champs obligatoires manquants (objet, date, cr\u00e9neau).' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        subject,
        reference: reference || null,
        date: new Date(date),
        timeSlot,
        message: message || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (e: any) {
    console.error('Appointments POST error:', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}

// PATCH — update appointment status (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acc\u00e8s r\u00e9serv\u00e9 aux administrateurs.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !['PENDING', 'CONFIRMED', 'DONE'].includes(status)) {
      return NextResponse.json({ error: 'Param\u00e8tres invalides.' }, { status: 400 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ appointment });
  } catch (e: any) {
    console.error('Appointments PATCH error:', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
