'use client';

import { useState, useEffect } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import type { EventData } from 'react-joyride';

const STEPS = [
  {
    target: 'body',
    content: 'Bienvenue chez AB DRIDI ! Ce rapide tour vous montrera les fonctionnalités clés en 30 secondes.',
    placement: 'center' as const,
    disableBeacon: true,
    title: 'Bienvenue !',
  },
  {
    target: '#nav-marches',
    content: 'Consultez ici tous les marchés publics actifs. Filtrez par département, secteur ou budget.',
    title: 'Veille marchés',
  },
  {
    target: '#nav-alertes',
    content: 'Créez vos alertes personnalisées. Vous recevrez chaque jour les marchés pertinents par email.',
    title: 'Alertes email',
  },
  {
    target: '#nav-pilotage',
    content: 'Suivez vos missions de prospection et le pipeline de vos opportunités.',
    title: 'Pilotage',
  },
  {
    target: '#user-menu-btn',
    content: 'Besoin d\'aide ? Accédez ici aux paramètres, à votre abonnement ou contactez Bilel directement.',
    title: 'Votre espace',
  },
];

interface OnboardingTourProps {
  shouldRun: boolean;
  onComplete: () => void;
}

export default function OnboardingTour({ shouldRun, onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (shouldRun) {
      // Delay to let the page render
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
  }, [shouldRun]);

  function handleCallback(data: EventData) {
    const { status, action, type } = data;
    const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED;
    if (finished || (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)) {
      setRun(false);
      onComplete();
    }
  }

  if (!run) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      onEvent={handleCallback}
      locale={{
        back: 'Retour',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer',
      }}
      styles={{
        tooltip: {
          borderRadius: 12,
          padding: 20,
          background: '#1E293B',
          color: '#E2E8F0',
          border: '1px solid #334155',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 700,
          color: '#E2E8F0',
          marginBottom: 4,
        },
        tooltipContent: {
          fontSize: 13,
          color: '#94A3B8',
          lineHeight: 1.6,
          padding: '8px 0 0',
        },
        buttonPrimary: {
          background: '#3B82F6',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
        },
        buttonBack: {
          color: '#94A3B8',
          fontSize: 13,
        },
        buttonSkip: {
          color: '#64748B',
          fontSize: 12,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
      }}
    />
  );
}
