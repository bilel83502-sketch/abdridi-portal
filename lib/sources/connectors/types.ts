import type { SourceRegistry, TenderNotice } from "@/lib/types";

export interface SourceConnector {
  key: string;
  fetchNotices(since?: Date): Promise<TenderNotice[]>;
}

export class StubConnector implements SourceConnector {
  key: string;

  constructor(private readonly source: SourceRegistry) {
    this.key = source.key;
  }

  async fetchNotices(): Promise<TenderNotice[]> {
    // Legal compliance: no scraping. Non-official sources must be link-out or partner-only.
    return [];
  }
}
