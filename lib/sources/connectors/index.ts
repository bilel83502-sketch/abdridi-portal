import type { SourceRegistry } from "@/lib/types";
import { StubConnector, type SourceConnector } from "@/lib/sources/connectors/types";

export function createConnector(source: SourceRegistry): SourceConnector {
  // BOAMP/TED/PLACE can be replaced by official API implementations when credentials/endpoints are ready.
  return new StubConnector(source);
}
