'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function getCookieConsent(): string | null {
  const match = document.cookie.split(';').find(c => c.trim().startsWith('cookie_consent='));
  return match ? match.split('=')[1]?.trim() : null;
}

function loadGAScript() {
  if (!GA_ID || document.getElementById('ga-script')) return;
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  const inline = document.createElement('script');
  inline.id = 'ga-inline';
  inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true,cookie_expires:34164000});`;
  document.head.appendChild(inline);
}

/** Called by CookieBanner on accept */
export function initAnalytics() {
  if (getCookieConsent() === 'accepted') {
    loadGAScript();
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  // Only load GA if consent was already given
  useEffect(() => {
    if (!GA_ID) return;
    if (getCookieConsent() === 'accepted') {
      loadGAScript();
    }
  }, []);

  // Track page views (only if GA is loaded)
  useEffect(() => {
    if (!GA_ID || !(window as any).gtag) return;
    (window as any).gtag('config', GA_ID, { page_path: pathname });
  }, [pathname]);

  return null;
}
