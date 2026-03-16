import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAppointmentEmails, sendConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// ─── Helper: find user by session (id first, email fallback) ───
async function findSessionUser(session: any) {
  const userId = session?.user?.id;
  const email = session?.user?.email;

  // Try by id first
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
    console.warn('[Appointments] User not found by id:', userId, '— trying email fallback');
  }

  // Fallback by email
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return user;
  }

  return null;
}

// GET — list appointments for current user (or all if admin)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const user = await findSessionUser(session);
    if (!user) {
      console.error('[Appointments GET] User not found. id:', (session.user as any).id, 'email:', session.user.email);
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
        orderBy: { requestedDate: 'desc' },
      });
      return NextResponse.json({ appointments });
    }

    // Any authenticated user can see their own appointments
    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      include: { relances: { orderBy: { date: 'desc' } } },
      orderBy: { requestedDate: 'desc' },
    });

    return NextResponse.json({ appointments });
  } catch (e: any) {
    console.error('[Appointments GET] ERROR:', e.message);
    console.error('[Appointments GET] Stack:', e.stack);
    return NextResponse.json({ error: e.message || 'Erreur serveur.' }, { status: 500 });
  }
}

// POST — create a new appointment (accessible to ALL users)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Appointments POST] No session or email found');
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const user = await findSessionUser(session);
    if (!user) {
      console.error('[Appointments POST] User not found. id:', (session.user as any).id, 'email:', session.user.email);
      return NextResponse.json({ error: 'Utilisateur introuvable. Veuillez vous reconnecter.' }, { status: 404 });
    }

    const body = await req.json();
    const { subject, marketReference, requestedDate, timeSlot, message } = body;

    if (!subject || !requestedDate || !timeSlot) {
      console.error('[Appointments POST] Missing required fields:', {
        subject: !!subject,
        requestedDate: !!requestedDate,
        timeSlot: !!timeSlot,
      });
      return NextResponse.json({
        error: 'Champs obligatoires manquants (objet, date, cr\u00e9neau).',
      }, { status: 400 });
    }

    // Validate date
    const parsedDate = new Date(requestedDate);
    if (isNaN(parsedDate.getTime())) {
      console.error('[Appointments POST] Invalid date:', requestedDate);
      return NextResponse.json({ error: 'Date invalide.' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        subject,
        marketReference: marketReference || null,
        requestedDate: parsedDate,
        timeSlot,
        message: message || null,
        status: 'PENDING',
      },
    });

    console.log('[Appointments POST] Created:', appointment.id, 'for user:', user.email);

    // Send email notifications (non-blocking: errors won't affect the response)
    try {
      await sendAppointmentEmails({
        clientName: user.name || 'Client',
        clientEmail: user.email,
        clientCompany: user.company || null,
        subject,
        marketReference: marketReference || null,
        requestedDate: parsedDate,
        timeSlot,
        message: message || null,
      });
    } catch (emailErr: any) {
      console.error('[Appointments POST] Email sending failed (non-blocking):', emailErr.message);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (e: any) {
    console.error('[Appointments POST] ERROR:', e.message);
    console.error('[Appointments POST] Stack:', e.stack);
    return NextResponse.json({
      error: e.message || 'Erreur lors de la cr\u00e9ation du rendez-vous.',
    }, { status: 500 });
  }
}

// PATCH — update appointment status (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifi\u00e9.' }, { status: 401 });
    }

    const user = await findSessionUser(session);
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
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    // Send confirmation email to client when admin confirms
    if (status === 'CONFIRMED' && appointment.user?.email) {
      try {
        await sendConfirmationEmail({
          clientEmail: appointment.user.email,
          clientName: appointment.user.name || 'Client',
          subject: appointment.subject,
          requestedDate: appointment.requestedDate,
          timeSlot: appointment.timeSlot,
        });
      } catch (emailErr: any) {
        console.error('[Appointments PATCH] Confirmation email failed (non-blocking):', emailErr.message);
      }
    }

    return NextResponse.json({ appointment });
  } catch (e: any) {
    console.error('[Appointments PATCH] ERROR:', e.message);
    console.error('[Appointments PATCH] Stack:', e.stack);
    return NextResponse.json({ error: e.message || 'Erreur serveur.' }, { status: 500 });
  }
}
