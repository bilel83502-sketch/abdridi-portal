// lib/types.ts
export type TenderStatus = "OPEN" | "CLOSED" | "CANCELLED";

export type TenderDocumentType = "DCE" | "RC" | "OTHER";

export type SourceRegistry = {
  key: string;
  name: string;
  baseUrl: string;
};

export type TenderNotice = {
  id: string;
  sourceKey: string;
  sourceNoticeId: string;
  referenceCode?: string | null;

  title: string;
  buyerName: string;
  buyerType?: string | null;

  locationLabel?: string | null;
  category?: string | null;

  publishedAt?: string | null;
  deadlineAt?: string | null;

  officialUrl: string;
  status?: TenderStatus;

  cpv?: string[];
};

export type TenderDocument = {
  id: string;
  noticeId: string;
  type: TenderDocumentType;
  label: string;
  url: string;
};

export type TenderFilters = {
  keywords?: string;
  deadline?: string;
  location?: string;
  buyerType?: string;
  category?: string;
  cpv?: string;
  sort?: "nearest" | "newest";
  page?: number;
};

export type TenderCardRow = {
  tender: TenderNotice;
  docs: TenderDocument[];
  source: SourceRegistry | null;
};
