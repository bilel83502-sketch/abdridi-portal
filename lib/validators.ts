import { z } from 'zod';

// ─── Mission ───

export const missionCreateSchema = z.object({
  name: z.string().min(3, 'Nom trop court (min 3)').max(200, 'Nom trop long (max 200)'),
  aoReference: z.string().max(100).optional().nullable(),
  aoTitle: z.string().max(500).optional().nullable(),
  deadline: z.string().datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .or(z.literal(''))
    .optional().nullable(),
  marcheId: z.string().cuid().or(z.literal('')).optional().nullable(),
  ficheRecapUrl: z.string().url().optional().nullable().or(z.literal('')),
  ficheRecapName: z.string().max(200).optional().nullable(),
});

export const missionUpdateSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  aoReference: z.string().max(100).optional().nullable(),
  aoTitle: z.string().max(500).optional().nullable(),
  deadline: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'NON_ABOUTIE']).optional(),
  ficheRecapUrl: z.string().url().optional().nullable().or(z.literal('')),
  ficheRecapName: z.string().max(200).optional().nullable(),
  marcheId: z.string().cuid().or(z.literal('')).optional().nullable(),
});

// ─── Prospect ───

export const prospectCreateSchema = z.object({
  company: z.string().min(2, 'Nom entreprise requis (min 2)').max(300),
  contact: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('Email invalide').optional().nullable().or(z.literal('')),
});

export const prospectBulkCreateSchema = z.array(prospectCreateSchema).min(1, 'Au moins un prospect');

export const prospectUpdateSchema = z.object({
  status: z.enum([
    'A_CONTACTER', 'PAS_JOIGNABLE', 'RAPPELER', 'INTERESSE',
    'VISIO_PLANIFIEE', 'DEVIS_ENVOYE', 'DEVIS_SIGNE', 'REFUSE', 'PAS_INTERESSE',
  ]).optional(),
  note: z.string().max(2000).optional().nullable(),
  rdvDate: z.string().optional().nullable(),
  devisAmount: z.union([z.number().positive(), z.string(), z.null()]).optional(),
  contact: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  lastContactAt: z.string().optional().nullable(),
});

// ─── Activity ───

export const prospectActivitySchema = z.object({
  action: z.enum(['APPEL', 'EMAIL', 'VISIO', 'DEVIS', 'NOTE']),
  result: z.string().max(50).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  status: z.string().optional().nullable(),
  rdvDate: z.string().optional().nullable(),
});

// ─── Document ───

export const documentCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(300),
  url: z.string().min(1, 'URL requise'),
  type: z.enum(['FICHE_RECAP', 'BASE_PROSPECTION', 'DCE', 'AUTRE']).default('AUTRE'),
});

export const documentUploadTypeSchema = z.enum(['FICHE_RECAP', 'BASE_PROSPECTION', 'DCE', 'AUTRE']);

// ─── Helper ───

export function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}
