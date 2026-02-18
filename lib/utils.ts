import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) { return clsx(inputs); }

export function formatCurrency(value: number | null | undefined): string {
  if (!value) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K€`;
  return `${value.toFixed(0)}€`;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

export function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function getNatureColor(nature: string) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    TRAVAUX: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
    FOURNITURES: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-400' },
    SERVICES: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  };
  return map[nature] || { bg: 'bg-white/5', text: 'text-white/60', dot: 'bg-white/40' };
}

export function getNatureLabel(nature: string) {
  return { TRAVAUX: 'Travaux', FOURNITURES: 'Fournitures', SERVICES: 'Services' }[nature] || nature;
}

export function getTypeLabel(type: string) {
  return { APPEL_OFFRES: "Appel d'offres", PROCEDURE_ADAPTEE: 'Procédure adaptée', MARCHE_NEGOCIE: 'Marché négocié', DIALOGUE_COMPETITIF: 'Dialogue compétitif', CONCESSION: 'Concession', AUTRE: 'Autre' }[type] || type;
}

export const DEPARTMENTS: Record<string, string> = {
  '01':'Ain','02':'Aisne','03':'Allier','04':'Alpes-de-Haute-Provence','05':'Hautes-Alpes',
  '06':'Alpes-Maritimes','07':'Ardèche','08':'Ardennes','09':'Ariège','10':'Aube',
  '11':'Aude','12':'Aveyron','13':'Bouches-du-Rhône','14':'Calvados','15':'Cantal',
  '16':'Charente','17':'Charente-Maritime','18':'Cher','19':'Corrèze','21':'Côte-d\'Or',
  '22':'Côtes-d\'Armor','23':'Creuse','24':'Dordogne','25':'Doubs','26':'Drôme',
  '27':'Eure','28':'Eure-et-Loir','29':'Finistère','30':'Gard','31':'Haute-Garonne',
  '32':'Gers','33':'Gironde','34':'Hérault','35':'Ille-et-Vilaine','36':'Indre',
  '37':'Indre-et-Loire','38':'Isère','39':'Jura','40':'Landes','41':'Loir-et-Cher',
  '42':'Loire','43':'Haute-Loire','44':'Loire-Atlantique','45':'Loiret','46':'Lot',
  '47':'Lot-et-Garonne','48':'Lozère','49':'Maine-et-Loire','50':'Manche','51':'Marne',
  '52':'Haute-Marne','53':'Mayenne','54':'Meurthe-et-Moselle','55':'Meuse','56':'Morbihan',
  '57':'Moselle','58':'Nièvre','59':'Nord','60':'Oise','61':'Orne','62':'Pas-de-Calais',
  '63':'Puy-de-Dôme','64':'Pyrénées-Atlantiques','65':'Hautes-Pyrénées',
  '66':'Pyrénées-Orientales','67':'Bas-Rhin','68':'Haut-Rhin','69':'Rhône',
  '70':'Haute-Saône','71':'Saône-et-Loire','72':'Sarthe','73':'Savoie','74':'Haute-Savoie',
  '75':'Paris','76':'Seine-Maritime','77':'Seine-et-Marne','78':'Yvelines',
  '79':'Deux-Sèvres','80':'Somme','81':'Tarn','82':'Tarn-et-Garonne','83':'Var',
  '84':'Vaucluse','85':'Vendée','86':'Vienne','87':'Haute-Vienne','88':'Vosges',
  '89':'Yonne','90':'Territoire de Belfort','91':'Essonne','92':'Hauts-de-Seine',
  '93':'Seine-Saint-Denis','94':'Val-de-Marne','95':'Val-d\'Oise',
};
