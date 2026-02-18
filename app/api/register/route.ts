import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
  name: z.string().min(2, 'Nom requis'),
  company: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (exists) return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email.toLowerCase().trim(), name: data.name, company: data.company || null, phone: data.phone || null, passwordHash },
    });
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 });
  }
}
