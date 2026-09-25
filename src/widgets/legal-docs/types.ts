export interface LegalSubSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface LegalSection {
  id: string;
  order: number;
  title: string;
  shortTitle?: string | undefined;
  paragraphs: string[];
  subsections?: LegalSubSection[] | undefined;
}

export interface LegalOperatorInfo {
  legalName: string;
  inn: string;
  ogrn: string;
  address: string;
  phone: string;
  email: string;
  tagline?: string;
}

export interface LegalDocumentConfig {
  slug: "privacy" | "personal-data-consent" | "cookies" | "offer";
  href: string;
  title: string;
  shortTitle: string;
  badge?: string | undefined;
  description: string;
  revisionIsoDate: string;
  effectiveDate: string;
  sections: LegalSection[];
  operatorInfo: LegalOperatorInfo;
}

export interface LegalDocNavigationItem {
  slug: "privacy" | "personal-data-consent" | "cookies" | "offer";
  href: string;
  title: string;
  shortTitle: string;
  badge?: string | undefined;
}
