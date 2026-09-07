/**
 * Global API fetch wrapper with error handling.
 * Dispatches 'api-error' custom event for toast notifications.
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: `Erreur ${res.status}` }));
      const msg = body.error || body.message || `Erreur ${res.status}`;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-error', { detail: msg }));
      }
      throw new Error(msg);
    }
    return res.json();
  } catch (err: any) {
    if (err.name !== 'Error' || !err.message?.startsWith('Erreur')) {
      const msg = 'Erreur de connexion au serveur';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api-error', { detail: msg }));
      }
    }
    throw err;
  }
}
