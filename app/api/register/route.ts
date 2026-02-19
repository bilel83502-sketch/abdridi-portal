import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 400 });
    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { email: data.email.toLowerCase(), name: data.name, company: data.company || null, passwordHash: hash } });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
