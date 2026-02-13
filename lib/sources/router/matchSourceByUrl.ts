import type { SourceRegistry } from "@/lib/types";

function normalizeHost(input: string): string | null {
  try {
    const url = new URL(input);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isHostMatch(host: string, baseUrl: string): boolean {
  const baseHost = normalizeHost(baseUrl);
  if (!baseHost) {
    return false;
  }

  return host === baseHost || host.endsWith(`.${baseHost}`);
}

export function matchSourceByUrl(officialUrl: string, registry: SourceRegistry[]): SourceRegistry | null {
  const targetHost = normalizeHost(officialUrl);
  if (!targetHost) {
    return null;
  }

  const sorted = [...registry].sort((a, b) => b.baseUrl.length - a.baseUrl.length);

  for (const source of sorted) {
    if (isHostMatch(targetHost, source.baseUrl)) {
      return source;
    }
  }

  return null;
}
