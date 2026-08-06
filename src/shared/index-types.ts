/** Shape of dist/<target>/data/index.json — UI and build share this contract. */

export type CaptureAsset = {
  path: string;
  originalName: string;
  format: string;
  kind: "still" | "motion" | string;
  width: number;
  height: number;
  bytes: number;
  hash: string;
  frameCount: number | null;
  durationSec: number | null;
  posterPath: string | null;
};

export type CaptureScore = {
  key: string;
  label: string;
  score: number;
  description: string;
};

export type CaptureRecord = {
  slug: string;
  title: string;
  visibility: string;
  capturedAt: string;
  sourceUrl: string | null;
  service: string;
  platform: string;
  screenType: string;
  uiPatterns: string[];
  tone: string;
  copyTone: string;
  tags: string[];
  insight: string;
  appVersion: string | null;
  body: string;
  asset: CaptureAsset;
  analysisScores?: CaptureScore[];
  analysisTotal?: number;
  localOnly?: boolean;
};

export type FacetCounts = {
  platform: Record<string, number>;
  screenType: Record<string, number>;
  uiPattern: Record<string, number>;
  tag: Record<string, number>;
  tone: Record<string, number>;
};

export type WikiPageRecord = {
  id: string;
  title: string;
  summary: string;
  visibility: string;
  body: string;
  captureRefs: string[];
};

export type CollectionRecord = {
  slug: string;
  title: string;
  description: string;
  captures: string[];
  body: string;
};

export type SiteIndex = {
  version: number;
  target: string;
  captures: CaptureRecord[];
  collections: CollectionRecord[];
  wiki: {
    indexBody: string;
    logEntries: { date: string; operation: string; title: string }[];
    pages: WikiPageRecord[];
  };
  facets: FacetCounts;
};
