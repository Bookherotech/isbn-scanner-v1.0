export type Confidence = 'Ready' | 'Needs Review' | 'ISBN Not Found';

export type CopyStatus = 'ONLINE' | 'WAITING' | 'SOLD' | 'ON_HOLD' | 'REMOVED' | 'CANCELLED';

export type ShopifyStatus = 'unpublished' | 'published' | 'error';

export interface CoverCandidate {
  url: string;
  source: string;
}

export interface BookData {
  title: string;
  author: string;
  isbn: string;
  format: string;
  dimensions: string;
  pages: number | null;
  synopsis: string;
  coverCandidates: CoverCandidate[];
  coverUrl: string;
  genres: string[];
}

export interface ReviewState {
  title: string;
  author: string;
  isbn: string;
  format: string;
  dimensions: string;
  pages: number | null;
  synopsis: string;
  coverUrl: string;
  coverCandidates: CoverCandidate[];
  description: string;
  tags: string[];
  price: number | null;
  location: string;
  confidence: Confidence;
}

export interface CopyRecord {
  id: string;
  book_id: string;
  isbn: string | null;
  title: string | null;
  author: string | null;
  format: string | null;
  dimensions: string | null;
  pages: number | null;
  synopsis: string | null;
  cover_url: string | null;
  cover_candidates: CoverCandidate[] | null;
  description: string | null;
  tags: string[] | null;
  price: number | null;
  location: string | null;
  sku: string | null;
  queue_position: number;
  status: CopyStatus;
  confidence: Confidence | null;
  shopify_product_id: string | null;
  shopify_inventory_id: string | null;
  shopify_status: ShopifyStatus | null;
  scan_date: string | null;
  sold_date: string | null;
  created_at: string;
}

export interface DashboardStats {
  todayScans: number;
  ready: number;
  needsReview: number;
  waitingQueue: number;
  isbnNotFound: number;
  published: number;
}
